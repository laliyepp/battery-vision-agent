---
name: reason-excel-batch
description: Read excel_manifest.json and batch-invoke /reason-excel-unified-schema for each Excel entry.
argument-hint: <excel_manifest.json>
---

# Reason Excel Batch

Read an `excel_manifest.json` file and invoke `/reason-excel-unified-schema` for each entry to extract declared parameters into the unified schema format.

## Arguments

- `$ARGUMENTS` — Path to `excel_manifest.json`

## Process

### Step 1 — Read and validate manifest

Read the `excel_manifest.json` file. If it's empty (`[]`), print `[Skip] No entries in excel_manifest.json` and stop.

### Step 2 — Process each entry

For each entry in the manifest, invoke:

```
/reason-excel-unified-schema <excel_path> <output_dir> <report_id>
```

Process sequentially (typically just 1 Excel file, but handles multiple). Print progress before each invocation:

```
[N/total] Processing <report_id>
```

If one invocation fails, report the error and continue with the next entry.

### Step 3 — Print summary

```
=== Reason Excel Batch Summary ===
Processed:
  - 技术参数-xxx → 技术参数-xxx_三电参数_unified_output.json
Skipped:
  - <report_id>: already exists
Failed:
  - <report_id>: <error>
Total: N entries
```

## Rules

- Use absolute paths from the manifest — do not modify them
- Do not fail the entire batch on a single entry error — report and continue
- Process entries in manifest order
- Each invocation of `/reason-excel-unified-schema` handles its own skip check (if output already exists)
