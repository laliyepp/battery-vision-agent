---
name: scan-excel-manifest
description: Scan a vehicle input directory's 结构参数 folder for Excel files and build excel_manifest.json.
argument-hint: <vehicle_input_dir> <vehicle_output_dir>
---

# Scan Excel Manifest

Scan the `结构参数` folder inside a vehicle input directory, find all Excel files, and produce `excel_manifest.json`.

## Arguments

- `$0` — Vehicle input directory (e.g., `data/certificate/CQC/2022011101503573/`)
- `$1` — Vehicle output directory (e.g., `output/2022011101503573/`)

## Output

- `$1/excel_manifest.json` — Array of entries, one per Excel found

## Process

### Step 1 — Discover the 结构参数 folder

Search `$0` for a directory containing `结构参数` in its name at any depth. Use Glob patterns like `$0/**/` and filter for folder names containing `结构参数` (e.g., `3-结构参数`).

If no such folder is found, write an empty `$1/excel_manifest.json` (`[]`) and stop.

### Step 2 — Find all Excel files

Find all `.xls` and `.xlsx` files directly inside the `结构参数` folder (flat scan, not recursive). Use Glob patterns like `<结构参数_folder>/*.xls` and `<结构参数_folder>/*.xlsx`.

If no Excel files are found, write an empty manifest `[]` and stop.

### Step 3 — Build manifest entries

For each Excel file found:

- **excel_path**: Absolute path to the Excel file
- **output_dir**: `$1` (vehicle output directory root — `{report_id}_三电参数_unified_output.json` is written to the root)
- **report_id**: Filename stem without extension

### Step 4 — Write manifest

Write `$1/excel_manifest.json`:

```json
[
  {
    "excel_path": "/abs/path/技术参数-xxx.xlsx",
    "output_dir": "/abs/path/output/vehicle_id",
    "report_id": "技术参数-xxx"
  }
]
```

Also create the output directory if it doesn't exist.

### Step 5 — Print summary

```
=== Scan Excel Manifest Summary ===
Found 结构参数 folder: <folder_path>
Excel files found: N
  - 技术参数-xxx.xlsx
Output: $1/excel_manifest.json
```

## Rules

- Use absolute paths for all entries in the manifest
- Only scan the `结构参数` folder — do not scan other folders like `历次申请及变更`
- Do not scan recursively into subfolders of the `结构参数` folder
- If no `结构参数` folder or no Excel files, write empty manifest `[]` — do not fail
- Sort entries alphabetically by filename
