"""Generate reason_manifest.json from *_raw.txt files in a single directory."""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Generate reason_manifest.json")
    parser.add_argument("--dir", required=True, help="Directory containing *_raw.txt files")
    args = parser.parse_args()

    target = Path(args.dir).resolve()
    raw_files = sorted(target.glob("*_raw.txt"))
    manifest = [
        {
            "raw_txt_path": str(f),
            "output_dir": str(target),
            "report_id": f.stem.replace("_raw", ""),
        }
        for f in raw_files
    ]
    out = target / "reason_manifest.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"reason_manifest.json ({len(manifest)} entries) → {out}")


if __name__ == "__main__":
    main()
