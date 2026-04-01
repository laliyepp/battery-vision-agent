"""Download the 3 files that failed due to filename-too-long, using truncated names."""

import os
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

URL = "https://www.dropbox.com/scl/fo/41gx28wqthkjgg5b05amt/AD2eGKKdEOj_CM3hWHjaO-c?rlkey=z841amkm7drtkwcd7k1cb6skg&dl=0"
DEST = Path("data/certificate")

FAILED_FILES = [
    "/CQC/2021011101408929/4-历次申请及变更/3-变2/2-实验方案/方案表-丰田汽车（中国）投资有限公司+丰田汽车九州公司宫田工厂、田原工厂NX系列车型补充14172、31498、16897标准换版(4137994、4138442、4138446、4138445、4138444、4138447、4137995单元)20230413修改.xlsx",
    "/CQC/2024011101674253/4-历次申请及变更/1-初次申请/2-实验方案/方案表-保时捷（中国）汽车销售有限公司-保时捷股份公司斯图加特工厂Taycan+turbo+D121、C121、D122纯电动车(111、112中期改款)(4238448、4238447、4382478、4254862、4254863、4254864、4308413)20240604修改-上海中心.xlsx",
    "/CQC/2024011101674253/4-历次申请及变更/1-初次申请/2-实验方案/方案表-保时捷（中国）汽车销售有限公司-保时捷股份公司斯图加特工厂Taycan+turbo+D121、C121、D122纯电动车(111、112中期改款)(4238448、4238447、4382478、4254862、4254863、4254864、4308413)20240722修改-长春中心.xlsx",
]


def truncate_filename(name: str, max_bytes: int = 250) -> str:
    """Truncate a filename to fit within max_bytes (UTF-8), preserving the extension."""
    ext = Path(name).suffix
    stem = name[: -len(ext)] if ext else name
    ext_bytes = ext.encode("utf-8")
    available = max_bytes - len(ext_bytes)
    # Truncate stem character by character
    while len(stem.encode("utf-8")) > available:
        stem = stem[:-1]
    return stem + ext


def main():
    token = os.environ.get("DROPBOX_ACCESS_TOKEN", "")
    if not token:
        raise SystemExit("DROPBOX_ACCESS_TOKEN not set")
    dbx = dropbox.Dropbox(token)

    for remote_path in FAILED_FILES:
        filename = Path(remote_path).name
        short_name = truncate_filename(filename)
        local_path = DEST / remote_path.lstrip("/").rsplit("/", 1)[0] / short_name

        print(f"Downloading: {remote_path}")
        print(f"  Truncated: {short_name}")
        local_path.parent.mkdir(parents=True, exist_ok=True)
        part_path = local_path.with_suffix(local_path.suffix + ".part")

        try:
            dbx.sharing_get_shared_link_file_to_file(str(part_path), url=URL, path=remote_path)
            part_path.rename(local_path)
            print(f"  OK ({local_path.stat().st_size} bytes)")
        except Exception as e:
            print(f"  FAILED: {e}")
            if part_path.exists():
                part_path.unlink()


if __name__ == "__main__":
    main()
