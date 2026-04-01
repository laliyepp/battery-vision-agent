---
name: chain-reason-excel
description: Chain scan-excel-manifest and reason-excel-batch to automatically find and process Excel parameter files.
argument-hint: <vehicle_input_dir> <vehicle_output_dir>
---

# Chain Reason Excel

Automatically discover Excel parameter files in the vehicle input directory's `结构参数` folder and extract declared parameters into the unified schema format.

## Arguments

- `$0` — Vehicle input directory (e.g., `data/certificate/CQC/2022011101503573/`)
- `$1` — Vehicle output directory (e.g., `output/2022011101503573/`)

## Steps

### Step 1 — Scan for Excel files

```
Skill: scan-excel-manifest
Args: $0 $1
```

Produces `$1/excel_manifest.json`.

### Step 2 — Process each Excel file

```
Skill: reason-excel-batch
Args: $1/excel_manifest.json
```

Produces `{report_id}_三电参数_unified_output.json` in the output directory for each Excel found.

### Step 3 — Print summary

```
=== Chain Reason Excel Complete ===
Input: $0
Output: $1
```

## Rules

- If Step 1 produces an empty manifest, Step 2 will skip automatically — do not fail
- Print `[Step N/2]` before each skill invocation
- Do not stop the chain on errors — let each skill handle its own error reporting
