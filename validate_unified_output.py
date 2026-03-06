#!/usr/bin/env python3
"""Validate _unified_output.json files against unified_schema_v2.json."""

import argparse
import json
import re
import sys
from pathlib import Path

DOMAINS = ["通用", "电池", "电机", "电控"]
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}([至到~]\d{4}-\d{2}-\d{2})?$")
DATE_FIELDS = {"送样日期", "签发日期", "检验日期"}


def load_schema(schema_path: Path) -> dict[str, list[str]]:
    """Return {domain: [field_names]} from the v2 schema."""
    with open(schema_path, encoding="utf-8") as f:
        raw = json.load(f)
    return {domain: list(fields.keys()) for domain, fields in raw.items()}


def validate_file(filepath: Path, schema: dict[str, list[str]]) -> list[str]:
    """Validate one _unified_output.json. Returns list of error messages."""
    errors = []
    try:
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        return [f"Cannot read file: {e}"]

    # Check domains
    for domain in DOMAINS:
        if domain not in data:
            errors.append(f"Missing domain: {domain}")
    for key in data:
        if key not in DOMAINS:
            errors.append(f"Extra domain: {key}")

    # Check fields per domain
    for domain in DOMAINS:
        if domain not in data:
            continue
        expected = set(schema.get(domain, []))
        actual = set(data[domain].keys())

        missing = expected - actual
        extra = actual - expected
        if missing:
            errors.append(f"[{domain}] Missing keys: {sorted(missing)}")
        if extra:
            errors.append(f"[{domain}] Extra keys: {sorted(extra)}")

        # Check all values are strings
        for key, val in data[domain].items():
            if not isinstance(val, str):
                errors.append(f"[{domain}] '{key}' value is {type(val).__name__}, expected str")

        # Check date format where applicable
        for key in DATE_FIELDS:
            if key in data[domain]:
                val = data[domain][key]
                if val and not DATE_RE.match(val):
                    errors.append(f"[{domain}] '{key}' date format invalid: '{val}'")

    return errors


def main():
    parser = argparse.ArgumentParser(description="Validate unified output files")
    parser.add_argument("--schema", required=True, help="Path to unified_schema_v2.json")
    parser.add_argument("--dir", required=True, help="Directory containing _unified_output.json files")
    parser.add_argument("--file", help="Validate a single file instead of scanning a directory")
    args = parser.parse_args()

    schema = load_schema(Path(args.schema))
    print(f"Schema loaded: {', '.join(f'{d}({len(fs)})' for d, fs in schema.items())}")

    if args.file:
        files = [Path(args.file)]
    else:
        files = sorted(Path(args.dir).rglob("*_unified_output.json"))

    if not files:
        print("No _unified_output.json files found.")
        return

    total_errors = 0
    for fp in files:
        errs = validate_file(fp, schema)
        if errs:
            print(f"\n  FAIL  {fp.name}")
            for e in errs:
                print(f"        {e}")
            total_errors += len(errs)
        else:
            print(f"  OK    {fp.name}")

    print(f"\n{len(files)} files checked, {total_errors} errors.")
    sys.exit(1 if total_errors else 0)


if __name__ == "__main__":
    main()
