---
name: merge-unified-table
description: Merge all *_unified_output.json files under a vehicle output directory into a single JSON array, sorted by 签发日期 ascending with declared Excel data last.
argument-hint: <vehicle_output_dir>
---

# Merge Unified Table

Merge all `*_unified_output.json` files (report + declared) into `merged_final_result.json` + `merged_final_result.xlsx`.

## Usage

```
/merge-unified-table <vehicle_output_dir>
```

## What it does

Run this command:

```bash
source .venv/bin/activate && python merge_unified_tool.py "$ARGUMENTS"
```