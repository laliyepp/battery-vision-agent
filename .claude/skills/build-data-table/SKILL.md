---
name: build-data-table
description: Build a 3-sheet Excel data table (电池/电机/电控) from all _reasoning_output.json files under a vehicle output directory. Uses semantic reasoning to classify, match, and merge headers across reports.
argument-hint: <vehicle_output_dir>
---

# Build Data Table

Build a 3-sheet Excel table from all `*_reasoning_output.json` files under a vehicle output directory. Each sheet covers one domain: 电池 (battery), 电机 (motor), 电控 (electronic control). You (Claude) do the semantic reasoning to classify and match headers; the Python tool only handles file I/O.

## Argument

- `$ARGUMENTS` — Path to the vehicle output directory (e.g., `output/2021011101404763`)

## Step 1: Discover files

Run:

```bash
source .venv/bin/activate && python data_table_tool.py scan --dir "$ARGUMENTS"
```

This prints `<subfolder>\t<file_path>` for each `*_reasoning_output.json`. The subfolder is the `change_status` (e.g., `initial`, `change1`, `change2`).

## Step 2: Read all JSON files

Read every discovered `_reasoning_output.json` file. For each file, note:
- Its `change_status` (from subfolder name)
- Its `送样日期` (from the JSON content; use `""` if missing)
- Its `签发日期` (from the JSON content; use `""` if missing)

## Step 3: Flatten, classify, and semantically merge

For each JSON file, flatten nested structures into column headers. Use your semantic understanding to:
- **Classify** each file's data into one or more of: 电池, 电机, 电控
- Recognize when keys across different report types represent the same concept
- Create meaningful, readable column headers
- Prefix nested keys with their parent for clarity (e.g., `电机.持续功率_kW`)

## Step 4: Build three tables

Group files by partition: `(送样日期, 签发日期, change_status)`. Sort partitions by `change_status` ascending (`initial` < `change1` < `change2`), then `签发日期` ascending, then `送样日期` ascending.

For each of the 3 domains (电池, 电机, 电控), build a separate table. For each partition that contains data for that domain, build one row:

1. **Single file in partition**: Generate headers and one row of values.
2. **Multiple files in partition**: Merge values. If the same header has different values across files, create suffixed headers: `header_1`, `header_2`, `header_3`...
3. **Moving to next partition**:
   - If a header from the previous partition has a new value → fill it
   - If a header from the previous partition has no value → leave it blank
   - If new headers appear → add new columns; old rows get empty cells
   - If an existing `_N` suffixed header would need its value changed → create `_N+1` instead of overwriting

First three columns of each sheet are always: `送样日期`, `签发日期`, `change_status`.

## Step 5: Write Excel

Write the 3 tables as a JSON file. Each row must be a **dict** (object mapping header name → value), not an array:

```json
{
  "sheets": [
    {"name": "电池", "headers": ["h1", "h2", ...], "rows": [{"h1": "v1", "h2": "v2", ...}, ...]},
    {"name": "电机", "headers": [...], "rows": [...]},
    {"name": "电控", "headers": [...], "rows": [...]}
  ]
}
```

Then run:

```bash
source .venv/bin/activate && python data_table_tool.py write --input <table.json> --output "$ARGUMENTS/data_table.xlsx"
```

Print: `[Done] data_table.xlsx written with 3 sheets`

# Special Notes:
- 电机控制器 belongs in the 电控 sheet, not 电机.
