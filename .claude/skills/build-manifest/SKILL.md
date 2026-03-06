---
name: build-manifest
description: Read a test plan Excel file and a report directory to build a vision extraction manifest for battery/motor/econtrol related PDFs.
argument-hint: <test_plan_xls_path> <report_dir_path> <output_dir>
---

# Build Manifest

Read a test plan Excel file, identify test items related to 电池 (battery), 电机 (motor), and 电控 (electronic control), match their report numbers to PDF files in the report directory, and write `vision_manifest.json`.

## Arguments

- `$0` — Path to the test plan Excel file (.xls or .xlsx)
- `$1` — Path to the directory containing PDF report files
- `$2` — Path to the output directory

## Process

### Step 1 — Parse the test plan Excel

Use Python via Bash (with `.venv` activated). Excel files are binary — do NOT use the Read tool.

- Use `xlrd` for `.xls` or `openpyxl` for `.xlsx`
- Detect the test plan sheet by trying these names: `方案表`, `纯电动`, `型式试验方案策划表`
- Print all test item rows as structured text with: item_number (col 1), test_item (col 2), standard (col 3), and repeating application column groups — each group has 4 columns: `(申请检验类别, 检验报告编号, 备注, 试验次数)`, starting at cols 4-7, 8-11, 12-15, etc.
- Handle continuation rows (empty item_number inherits from the parent row) and multi-value report numbers (split on `\n` and `;`)

### Step 2 — Identify 电池/电机/电控 test items

From the parsed output, semantically identify test items **directly** related to 电池/电机/电控 and collect their report numbers.

**Include**: Component-level testing of batteries (cells, modules, packs), drive motors/controllers, BMS, charging systems, or communication protocols.

**Exclude**: Whole-vehicle tests such as safety requirements, crash tests, instrumentation, range/energy consumption, or acoustics.

### Step 3 — List available PDFs

Use Glob to list all PDF files in the report directory.

### Step 4 — Match report numbers to PDFs

Match the collected report numbers from Step 2 to actual PDF filenames. Report IDs may appear as a substring of the filename.

### Step 5 — Fallback if no test items matched

If Step 2 found no relevant test items (or no report numbers could be extracted), fall back to **reading the first 3 pages of each PDF** to determine relevance. Do NOT rely on filename patterns — filenames are opaque report codes and cannot be used to infer content.

For each PDF from Step 3, use Python with `pymupdf` (fitz) to extract the text of page 1. Then check whether the extracted text contains 电池/电机/电控 related keywords (e.g., 蓄电池, 动力电池, 驱动电机, 电机控制器, 充电, BMS, 电磁兼容, etc.). Select only those PDFs whose first-page text indicates 电池/电机/电控 content. DO NOT select all PDFs — be selective based on actual page content.

### Step 6 — Write the manifest

Write `$2/vision_manifest.json` as a JSON array:

```json
[
  {
    "pdf_path": "/absolute/path/to/report.pdf",
    "output_dir": "/absolute/path/to/output",
    "report_id": "filename_stem"
  }
]
```

## Rules

- Use semantic reasoning to determine what is 电池/电机/电控 related — do not hardcode section numbers or keywords
- Deduplicate PDFs (the same file may be referenced by multiple test items)
- Use absolute paths in the manifest
- If no relevant PDFs are found, write an empty array `[]`
