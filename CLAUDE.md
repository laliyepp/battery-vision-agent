# Battery Vision Agent

## Project Overview

Research tool for extracting 电池 (battery), 电机 (motor), and 电控 (electronic control) parameters from Chinese CCC vehicle certification documents. Processes structured Excel parameter files and raw certification documents (PDFs, images, XLS test plans).

## Architecture

### Python Tools

| File | Purpose |
|------|---------|
| `vision_tool.py` | Render PDF pages → Claude Vision API (parallel pages, parallel files) → `_raw.txt` |
| `generate_reason_manifest.py` | Scan one dir for `_raw.txt` files → `reason_manifest.json` |
| `excel_to_markdown.py` | Convert Excel → Markdown; in manifest mode also emits `history_reason_manifest.json` |
| `merge_unified_tool.py` | Merge all `_unified_output.json` → `merged_final_result.json` + `.xlsx` (4-sheet) |
| `validate_unified_output.py` | Validate `_unified_output.json` files against `schema/unified_schema_v2.json` |

### Claude Code Skills

#### Current Application Pipeline (`/chain-extract-batch`)

| Skill | Invocation | Purpose |
|-------|-----------|---------|
| `reason-excel-unified-schema` | `/reason-excel-unified-schema <excel_path> <output_dir>` | Read root Excel → `三电参数_unified_output.json` (canonical schema) |
| `build-manifest` | `/build-manifest <test_plan_xls> <report_dir> <output_dir>` | Read test plan, match to PDFs → `vision_manifest.json` |
| `build-manifest-batch` | `/build-manifest-batch <vehicle_input_dir> <vehicle_output_dir>` | Batch-invoke `/build-manifest` for each subfolder |
| `vision-extract` | `/vision-extract <vision_manifest.json>` | Invoke `vision_tool.py` — parallel Vision API → `_raw.txt` |
| `vision-extract-batch` | `/vision-extract-batch <vehicle_output_dir>` | Batch-invoke `/vision-extract` for each subfolder |
| `build-reason-manifest` | `/build-reason-manifest <output_dir>` | Scan dir for `_raw.txt` → `reason_manifest.json` |
| `build-reason-manifest-batch` | `/build-reason-manifest-batch <vehicle_output_dir>` | Batch-invoke `/build-reason-manifest` for each subfolder |
| `reason-text-unified-schema` | `/reason-text-unified-schema <reason_manifest.json>` | Read `_raw.txt` → `_unified_output.json` (Claude Code mode) |
| `reason-text-unified-schema-api` | `/reason-text-unified-schema-api <reason_manifest.json>` | Read `_raw.txt` → `_unified_output.json` (Claude API mode, parallel) |
| `reason-text-unified-schema-batch` | `/reason-text-unified-schema-batch <vehicle_output_dir> [api\|cc]` | Batch-invoke reasoning for each subfolder |
| `merge-unified-table` | `/merge-unified-table <vehicle_output_dir>` | Merge all `_unified_output.json` → `merged_final_result.json` + `.xlsx` |
| `chain-extract-batch` | `/chain-extract-batch <root_excel> <vehicle_input_dir> <vehicle_output_dir> [api\|cc]` | Chain all 6 steps for a vehicle |

#### History Pipeline (`/special-chain-history-extract`)

| Skill | Invocation | Purpose |
|-------|-----------|---------|
| `special-scan-history-excels` | `/special-scan-history-excels <vehicle_input_dir> <output_dir>` | Scan history folder → `history_manifest.json` |
| `special-reason-history-excel-unified-schema` | `/special-reason-history-excel-unified-schema <markdown_path> <output_dir> <report_id> <application_date>` | Read one history markdown → `_unified_output.json` |
| `special-reason-history-excel-batch` | `/special-reason-history-excel-batch <history_reason_manifest.json>` | Batch-invoke reasoning for each history entry |
| `special-chain-history-extract` | `/special-chain-history-extract <vehicle_input_dir> <output_dir>` | Chain all 4 steps for history extraction |

## Pipelines

### Current Application (`/chain-extract-batch`)

```
Step 1 (parallel): /reason-excel-unified-schema <root_excel> <output_dir>
  → 三电参数_unified_output.json (declared parameters from root Excel)

Step 2 (parallel): /build-manifest-batch <vehicle_input_dir> <vehicle_output_dir>
  → vision_manifest.json per subfolder

Step 3: /vision-extract-batch <vehicle_output_dir>
  → {report_id}_raw.txt per subfolder (Vision API extraction)

Step 4: /build-reason-manifest-batch <vehicle_output_dir>
  → reason_manifest.json per subfolder

Step 5: /reason-text-unified-schema-batch <vehicle_output_dir> [api|cc]
  → {report_id}_unified_output.json per subfolder

Step 6: /merge-unified-table <vehicle_output_dir>
  → merged_final_result.json + merged_final_result.xlsx
```

### History (`/special-chain-history-extract`)

```
Step 1: /special-scan-history-excels → history_manifest.json
Step 2: excel_to_markdown.py --manifest → _excel.md files + history_reason_manifest.json
Step 3: /special-reason-history-excel-batch → _unified_output.json per history entry
Step 4: merge_unified_tool.py --sort-mode history → merged_final_result.json + .xlsx
```

## Output Structure

```
output/<vehicle_id>/
  initial/
    三电参数_unified_output.json   # Declared params from root Excel
    vision_manifest.json         # PDFs to process
    reason_manifest.json         # Raw text files to reason over
    {report_id}_raw.txt          # Vision API extracted text per PDF
    {report_id}_unified_output.json  # Canonical schema output per PDF
  change1/
    vision_manifest.json
    reason_manifest.json
    {report_id}_raw.txt
    {report_id}_unified_output.json
  merged_final_result.json       # All _unified_output.json merged
  merged_final_result.xlsx       # 4-sheet Excel (通用/电池/电机/电控)
  history_manifest.json          # History Excel scan results
  history_reason_manifest.json   # Markdown paths for reasoning
  history/
    <subfolder_id>/
      <report_id>_excel.md
      <report_id>_unified_output.json
```

## Development

```bash
source .venv/bin/activate
```

### Dependencies (in .venv)

- anthropic — Claude Vision API client (async parallel page extraction)
- pandas, openpyxl — Excel reading
- xlrd — Legacy .xls reading
- pymupdf (fitz) — PDF page rendering to PNG
- markitdown — Excel to Markdown conversion

### Environment

- `ANTHROPIC_API_KEY` — required for vision extraction and API-mode reasoning (set in `.env` or environment)

## Conventions

- UTF-8 encoding throughout
- Vision extraction via Claude Vision API (`claude-sonnet-4-6`), parallel per page and per file
- Reasoning via Claude Code skills (semantic understanding, no hardcoded filters)
- All outputs use canonical schema from `schema/unified_schema_v2.json` — 4 domains (通用/电池/电机/电控)
- JSON keys are meaningful Chinese with units where applicable (e.g., `额定电压_V`, `峰值功率_kW`)
