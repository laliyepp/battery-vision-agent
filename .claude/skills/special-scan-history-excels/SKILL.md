---
name: special-scan-history-excels
description: Scan a vehicle input directory for historical change records, find parameter Excels and application dates, and write history_manifest.json.
argument-hint: <vehicle_input_dir> <output_dir>
---

# Special Scan History Excels

Semantically explore all subfolders under `<vehicle_input_dir>/4-历次申请及变更/` (or similar history folder), find parameter Excel files and application dates from `申请信息.pdf`, and produce `history_manifest.json`.

## Arguments

- `$0` — Vehicle input directory (e.g., `data/raw_example/2021011101404763/`)
- `$1` — Vehicle output directory (e.g., `output/2021011101404763/`)

## Output

- `$1/history_manifest.json` — Array of entries, one per Excel found
- Creates `$1/history/<subfolder_id>/` directories for each entry

## Process

### Step 1 — Discover the history folder

Search `$0` for a directory related to historical applications/changes. Look for folder names containing `历次申请` or `历次变更` at any depth. Use Glob patterns like `$0/**/` and filter semantically.

If no history folder is found, write an empty `$1/history_manifest.json` (`[]`) and stop.

### Step 2 — Discover all subfolders

List all immediate subdirectories of the history folder. Each subfolder represents one historical application/change record (e.g., `20190911010892B4`, `20190911010892B10`). Sort them alphabetically.

### Step 3 — For each subfolder, find Excel + date

For each subfolder:

**3a. Parameter Excels**: Recursively search for `*.xls` and `*.xlsx` files. Look for ALL files whose names contain `整车参数` (whole vehicle parameters). Create one manifest entry per Excel file found (a single subfolder may produce multiple entries). Skip subfolder if no parameter Excel found.

**3b. Application date**: Search for `申请信息.pdf` in the subfolder. If found, extract the application date using Python with pymupdf:

```bash
source .venv/bin/activate && python -c "
import fitz
doc = fitz.open('<path_to_pdf>')
text = ''
for page in doc:
    text += page.get_text()
doc.close()
print(text)
"
```

Look for date patterns in the extracted text (e.g., `YYYY-MM-DD`, `YYYY年MM月DD日`, or date fields near `申请日期`/`受理日期`). If no PDF or no date found, use `""` for the date.

**3c. Build report_id**: Derive from the Excel filename — take the base name without extension, but simplify if needed. For example: `参数表附件整车参数_2020091101021431_26667398.xls` → `参数表附件整车参数_26667398` (keep the meaningful parts, drop the middle timestamp if it matches the subfolder ID pattern).

**3d. Output dir**: `$1/history/<subfolder_id>/`

### Step 4 — Write manifest

Write `$1/history_manifest.json` with all discovered entries:

```json
[
  {
    "subfolder_id": "20190911010892B10",
    "excel_path": "/abs/path/参数表附件整车参数_2020091101021431_26667398.xls",
    "report_id": "参数表附件整车参数_26667398",
    "output_dir": "/abs/path/output/<vehicle_id>/history/20190911010892B10",
    "application_date": "2020-08-31"
  }
]
```

Also create the output directories for each entry.

### Step 5 — Print summary

```
=== Special Scan History Excels Summary ===
Found N subfolders in <history_folder>
Manifest entries: M
  - 20190911010892B4 → 参数表附件整车参数_25484138 (date: 2019-10-15)
  - 20190911010892B10 → 参数表附件整车参数_26667398 (date: 2020-08-31)
Skipped (no Excel):
  - <subfolder_name>
Output: $1/history_manifest.json
```

## Rules

- Use absolute paths for all entries in the manifest
- Do not hardcode subfolder names — discover them dynamically
- Skip subfolders that have no parameter Excel (but report them)
- Application date is best-effort — use `""` if not extractable
- Create output directories even if they're empty
- Sort manifest entries by subfolder_id alphabetically
