"""Vision extraction tool: render PDF pages to images, call Claude Vision API in parallel.

Supports file-level parallelism (up to FILE_CONCURRENCY PDFs at once),
and page-level parallelism within each PDF (all pages concurrent).
"""

import asyncio
import base64
import json
import os
import sys
from pathlib import Path

import anthropic
import fitz

# Load .env if present
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 4096
DPI = 200
FILE_CONCURRENCY = 5
MAX_IMAGE_BYTES = int(5 * 1024 * 1024 * 3 / 4)  # raw PNG limit so base64 stays under 5 MB

PROMPT = """\
Extract all information from this document page into clean, structured text. \
Use "key: value" for fields, "| col1 | col2 |" for tables, and plain text for paragraphs. \
Preserve all Chinese text, numbers, and units exactly. \
For photos or charts, briefly describe what they show in brackets.\
"""


def render_pages(pdf_path: str) -> list[bytes]:
    """Render each PDF page to PNG bytes, downscaling if needed to stay under 5 MB."""
    pdf = fitz.open(pdf_path)
    pages = []
    for page in pdf:
        dpi = DPI
        while True:
            pix = page.get_pixmap(dpi=dpi)
            png_bytes = pix.tobytes("png")
            if len(png_bytes) <= MAX_IMAGE_BYTES or dpi <= 50:
                break
            dpi = int(dpi * 0.75)
        pages.append(png_bytes)
    pdf.close()
    return pages


async def extract_page(
    client: anthropic.AsyncAnthropic, png_bytes: bytes, page_num: int
) -> tuple[int, str]:
    """Send one page image to Claude Vision API, return (page_num, text)."""
    b64 = base64.standard_b64encode(png_bytes).decode("utf-8")
    message = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
    )
    text = message.content[0].text
    return (page_num, text)


async def process_pdf(
    client: anthropic.AsyncAnthropic,
    pdf_path: str,
    output_dir: str,
    report_id: str,
    index: int,
    total: int,
) -> None:
    """Process one PDF: render pages, parallel API calls, write _raw.txt when all pages done."""
    out_path = Path(output_dir) / f"{report_id}_raw.txt"
    if out_path.exists():
        print(f"  [{index}/{total}] SKIP {report_id} (already exists)")
        return

    png_pages = render_pages(pdf_path)
    print(f"  [{index}/{total}] {report_id}: {len(png_pages)} pages → API...", flush=True)

    tasks = [extract_page(client, png_bytes, i) for i, png_bytes in enumerate(png_pages)]
    results = await asyncio.gather(*tasks)

    # Sort by page number, assemble text
    results.sort(key=lambda r: r[0])
    parts = []
    for page_num, text in results:
        parts.append(f"=== 第{page_num + 1}页 ===")
        parts.append(text)
        parts.append("")

    combined = "\n".join(parts)
    out_path.write_text(combined, encoding="utf-8")
    print(f"  [{index}/{total}] {report_id}: done ({len(combined)} chars)")


async def main(manifest_path: str) -> None:
    manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    if not manifest:
        print("Empty manifest, nothing to process.")
        return

    print(f"Processing {len(manifest)} PDFs (concurrency={FILE_CONCURRENCY})\n")

    client = anthropic.AsyncAnthropic()
    semaphore = asyncio.Semaphore(FILE_CONCURRENCY)

    async def process_with_limit(entry: dict, index: int) -> None:
        async with semaphore:
            try:
                await process_pdf(
                    client,
                    entry["pdf_path"],
                    entry["output_dir"],
                    entry["report_id"],
                    index,
                    len(manifest),
                )
            except Exception as e:
                print(f"  [{index}/{len(manifest)}] ERROR {entry['report_id']}: {e}")

    tasks = [
        process_with_limit(entry, i + 1)
        for i, entry in enumerate(manifest)
    ]
    await asyncio.gather(*tasks)

    print(f"\nAll done. {len(manifest)} PDFs processed.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python vision_tool.py <vision_manifest.json>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
