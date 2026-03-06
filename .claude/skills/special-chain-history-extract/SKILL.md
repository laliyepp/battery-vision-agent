---
name: special-chain-history-extract
description: Chain the full history extraction pipeline — scan history excels, batch-reason each one, then merge all unified outputs.
argument-hint: <vehicle_input_dir> <output_dir>
---

# Special Chain History Extract

Run the full 3-step history extraction pipeline for a vehicle by invoking existing skills in sequence.

## Arguments

- `$0` — Vehicle input directory (e.g., `data/raw_example/2021011101404763/`)
- `$1` — Vehicle output directory (e.g., `output/2021011101404763/`)

## Steps

### Step 1 — Scan history folder for Excels and dates

```
/special-scan-history-excels $0 $1
```

Print `[Step 1/4] Scanning history excels...` before invoking.

If the resulting `$1/history_manifest.json` is empty (`[]`), print `[Done] No history records found — nothing to process.` and stop.

### Step 2 — Convert all Excels to Markdown

```bash
source .venv/bin/activate && python excel_to_markdown.py --manifest "$1/history_manifest.json"
```

Print `[Step 2/4] Converting Excels to markdown...` before running.

This reads `history_manifest.json`, converts each entry's Excel to `<output_dir>/<report_id>_excel.md`, and writes `$1/history_reason_manifest.json` mapping markdown paths to metadata. Skips files that already exist.

### Step 3 — Batch-reason all history Excels

```
/special-reason-history-excel-batch $1/history_reason_manifest.json
```

Print `[Step 3/4] Batch reasoning history excels...` before invoking.

### Step 4 — Merge all unified outputs (history sort mode)

Print `[Step 4/4] Merging all unified outputs...` before invoking.

Run directly (NOT via `/merge-unified-table`, since we need the `--sort-mode history` flag):

```bash
source .venv/bin/activate && python merge_unified_tool.py "$1" --sort-mode history
```

This merges ALL `*_unified_output.json` files found under `$1` into `$1/merged_final_result.json` and `$1/merged_final_result.xlsx`. The `--sort-mode history` flag sorts by subfolder ID (extracted from the path between first and second `/`) ascending, then by 签发日期 ascending.

## Rules

- Run steps strictly sequentially — each depends on the previous
- Print `[Step N/4]` before each skill invocation
- If step 1 produces an empty manifest, stop early (skip steps 2-4)
- Do not stop the pipeline on errors in individual entries — batch skills handle that internally
- Step 4 reuses the existing `/merge-unified-table` skill which runs `merge_unified_tool.py`
