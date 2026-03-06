---
name: build-unified-excel
description: Write unified_schema_result.json to a 4-sheet Excel file (通用/電池/電機/電控) with headers from the canonical schema.
argument-hint: <vehicle_output_dir>
---

# Build Unified Excel

Write `unified_schema_result.json` to a 4-sheet Excel file using `unified_table_writer.py`.

## Argument

- `$ARGUMENTS` — Path to the vehicle output directory (e.g., `output/2021011101404763`)

## Step 1: Verify input exists

Check that `$ARGUMENTS/unified_schema_result.json` exists. If not, print an error and stop.

## Step 2: Run the writer

```bash
source .venv/bin/activate && python unified_table_writer.py "$ARGUMENTS/unified_schema_result.json"
```

This writes `unified_schema_table.xlsx` in the same directory as the input JSON.

Print: `[Done] unified_schema_table.xlsx written with 4 sheets (通用/电池/电机/电控)`
