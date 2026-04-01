"""Download a Dropbox shared folder recursively with resume support.

Usage:
    python download_dropbox.py --url "https://www.dropbox.com/scl/fo/..." --dest data/certificate
    python download_dropbox.py --url "https://..." --dry-run
"""

import argparse
import asyncio
import os
import tempfile
import time
from pathlib import Path

import dropbox
from dropbox.files import SharedLink

# Load .env if present
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

CONCURRENCY = 5
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds, doubles each retry


def get_client() -> dropbox.Dropbox:
    token = os.environ.get("DROPBOX_ACCESS_TOKEN", "")
    if not token:
        print("ERROR: DROPBOX_ACCESS_TOKEN not set. Add it to .env or environment.")
        print("  1. Go to https://www.dropbox.com/developers/apps")
        print("  2. Create app → Scoped access → Full Dropbox")
        print("  3. Permissions: enable sharing.read, files.metadata.read, files.content.read")
        print("  4. Settings → Generate access token")
        print("  5. Add to .env: DROPBOX_ACCESS_TOKEN=<token>")
        raise SystemExit(1)
    return dropbox.Dropbox(token)


def list_folder_recursive(
    dbx: dropbox.Dropbox, url: str, path: str = ""
) -> list[dict]:
    """Recursively list all files in a shared folder link."""
    files = []
    shared_link = SharedLink(url=url)

    try:
        result = dbx.files_list_folder(path=path, shared_link=shared_link)
    except dropbox.exceptions.ApiError as e:
        print(f"ERROR listing {path or '/'}: {e}")
        return files

    while True:
        for entry in result.entries:
            if isinstance(entry, dropbox.files.FolderMetadata):
                sub_path = f"{path}/{entry.name}" if path else f"/{entry.name}"
                print(f"  Scanning {sub_path}/", flush=True)
                files.extend(list_folder_recursive(dbx, url, sub_path))
            elif isinstance(entry, dropbox.files.FileMetadata):
                rel_path = f"{path}/{entry.name}" if path else f"/{entry.name}"
                files.append({
                    "path": rel_path,
                    "size": entry.size,
                    "name": entry.name,
                })
        if not result.has_more:
            break
        result = dbx.files_list_folder_continue(result.cursor)

    return files


def should_download(local_path: Path, remote_size: int, force: bool) -> bool:
    if force:
        return True
    if local_path.exists() and local_path.stat().st_size == remote_size:
        return False
    return True


def fmt_size(n: int) -> str:
    if n >= 1_073_741_824:
        return f"{n / 1_073_741_824:.1f} GB"
    if n >= 1_048_576:
        return f"{n / 1_048_576:.1f} MB"
    if n >= 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n} B"


async def download_file(
    dbx: dropbox.Dropbox,
    url: str,
    remote_path: str,
    local_path: Path,
    index: int,
    total: int,
    size: int,
) -> None:
    """Download a single file from the shared link."""
    local_path.parent.mkdir(parents=True, exist_ok=True)
    part_path = local_path.with_suffix(local_path.suffix + ".part")

    def _download():
        dbx.sharing_get_shared_link_file_to_file(
            str(part_path), url=url, path=remote_path
        )

    await asyncio.to_thread(_download)
    part_path.rename(local_path)
    print(f"  [{index}/{total}] {remote_path} ({fmt_size(size)})")


async def download_with_retry(
    semaphore: asyncio.Semaphore,
    dbx: dropbox.Dropbox,
    url: str,
    remote_path: str,
    local_path: Path,
    index: int,
    total: int,
    size: int,
) -> bool:
    """Download with semaphore concurrency control and retry."""
    async with semaphore:
        for attempt in range(MAX_RETRIES):
            try:
                await download_file(dbx, url, remote_path, local_path, index, total, size)
                return True
            except dropbox.exceptions.AuthError:
                print(f"\n  AUTH ERROR: Token expired or invalid.")
                print("  Generate a new token and update .env, then re-run (resume will skip completed files).")
                raise SystemExit(1)
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAY * (2 ** attempt)
                    print(f"  [{index}/{total}] RETRY {remote_path} (attempt {attempt + 2}/{MAX_RETRIES}): {e}")
                    await asyncio.sleep(delay)
                else:
                    print(f"  [{index}/{total}] FAILED {remote_path}: {e}")
                    return False


async def run(args: argparse.Namespace) -> None:
    dbx = get_client()
    dest = Path(args.dest)

    print(f"Listing files from shared folder...", flush=True)
    all_files = list_folder_recursive(dbx, args.url)

    if not all_files:
        print("No files found in the shared folder.")
        return

    total_size = sum(f["size"] for f in all_files)
    print(f"\nFound {len(all_files)} files ({fmt_size(total_size)})")

    # Determine which files need downloading
    to_download = []
    skipped = 0
    for f in all_files:
        local_path = dest / f["path"].lstrip("/")
        if should_download(local_path, f["size"], args.force):
            to_download.append((f, local_path))
        else:
            skipped += 1

    dl_size = sum(f["size"] for f, _ in to_download)
    print(f"  To download: {len(to_download)} files ({fmt_size(dl_size)})")
    if skipped:
        print(f"  Skipping: {skipped} files (already exist with matching size)")

    if args.dry_run:
        print(f"\n--- Dry run: files that would be downloaded ---")
        for f, local_path in to_download:
            print(f"  {f['path']} ({fmt_size(f['size'])})")
        return

    if not to_download:
        print("\nAll files already downloaded.")
        return

    # Download
    print(f"\nDownloading {len(to_download)} files (concurrency={args.concurrency})...\n")
    semaphore = asyncio.Semaphore(args.concurrency)
    start = time.time()

    tasks = [
        download_with_retry(
            semaphore, dbx, args.url,
            f["path"], local_path,
            i + 1, len(to_download), f["size"],
        )
        for i, (f, local_path) in enumerate(to_download)
    ]
    results = await asyncio.gather(*tasks)

    elapsed = time.time() - start
    succeeded = sum(1 for r in results if r)
    failed = sum(1 for r in results if not r)

    print(f"\nDone in {elapsed:.0f}s — {succeeded} downloaded, {skipped} skipped, {failed} failed")


def main():
    parser = argparse.ArgumentParser(description="Download Dropbox shared folder recursively")
    parser.add_argument("--url", required=True, help="Dropbox shared folder URL")
    parser.add_argument("--dest", default="data/certificate", help="Local destination directory")
    parser.add_argument("--concurrency", type=int, default=CONCURRENCY, help="Parallel downloads")
    parser.add_argument("--dry-run", action="store_true", help="List files without downloading")
    parser.add_argument("--force", action="store_true", help="Re-download even if file exists")
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
