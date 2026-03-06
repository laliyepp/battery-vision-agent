#!/usr/bin/env python3
"""Convert an Excel file (.xls or .xlsx) to Markdown using Microsoft MarkItDown."""

import argparse
import json
import os
import sys

from markitdown import MarkItDown


def convert(excel_path: str) -> str:
    """Convert an Excel file to markdown text."""
    md = MarkItDown()
    result = md.convert(excel_path)
    return result.text_content


def convert_manifest(manifest_path: str) -> None:
    """Read a history_manifest.json and convert each entry's Excel to markdown."""
    with open(manifest_path, "r", encoding="utf-8") as f:
        entries = json.load(f)

    total = len(entries)
    skipped = 0
    converted = 0
    failed = 0

    for i, entry in enumerate(entries, 1):
        excel_path = entry["excel_path"]
        output_dir = entry["output_dir"]
        report_id = entry["report_id"]
        md_path = os.path.join(output_dir, f"{report_id}_excel.md")

        if os.path.exists(md_path):
            skipped += 1
            continue

        try:
            os.makedirs(output_dir, exist_ok=True)
            text = convert(excel_path)
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(text)
            converted += 1
        except Exception as e:
            print(f"[Error] {report_id}: {e}", file=sys.stderr)
            failed += 1

    print(f"[Done] {converted} converted, {skipped} skipped, {failed} failed (total {total})",
          file=sys.stderr)

    # Build history_reason_manifest.json
    reason_entries = []
    for entry in entries:
        md_path = os.path.join(entry["output_dir"], f"{entry['report_id']}_excel.md")
        if os.path.exists(md_path):
            reason_entries.append({
                "markdown_path": md_path,
                "output_dir": entry["output_dir"],
                "report_id": entry["report_id"],
                "subfolder_id": entry["subfolder_id"],
                "application_date": entry.get("application_date", ""),
            })

    manifest_dir = os.path.dirname(os.path.abspath(manifest_path))
    reason_manifest_path = os.path.join(manifest_dir, "history_reason_manifest.json")
    with open(reason_manifest_path, "w", encoding="utf-8") as f:
        json.dump(reason_entries, f, ensure_ascii=False, indent=2)
    print(f"[Done] history_reason_manifest.json ({len(reason_entries)} entries)",
          file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Convert Excel to Markdown")
    parser.add_argument("excel_path", nargs="?", help="Path to .xls or .xlsx file")
    parser.add_argument("-o", "--output", help="Output .md file path (default: stdout)")
    parser.add_argument("--manifest", help="Path to history_manifest.json for batch conversion")
    args = parser.parse_args()

    if args.manifest:
        convert_manifest(args.manifest)
        return

    if not args.excel_path:
        parser.error("excel_path is required when --manifest is not used")

    text = convert(args.excel_path)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"[Done] {args.output} ({len(text)} chars)", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
