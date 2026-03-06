---
name: build-unified-table
description: Map data_table_input.json and 三电参数.json to the unified schema, producing unified_schema_result.json with nested cell values.
argument-hint: <vehicle_output_dir>
---

# Build Unified Table

Map `data_table_input.json` and `三电参数.json` (if present) to the canonical unified schema. This is a Claude reasoning skill — no Python tool needed. You (Claude) read both source files + the schema, then use semantic reasoning to map source columns to canonical columns.

**All conventions** (cell value wrapping, empty value handling, dual-motor rules, unit conversion, drop rules, sorting) are defined in `schema/unified_schema.md`. Read it first.

## Argument

- `$ARGUMENTS` — Path to the vehicle output directory (e.g., `output/2024011101624815`)

## Step 1: Read inputs

Read these files (use the Read tool):

1. `schema/unified_schema.json` — canonical columns + alias mappings for 通用/电池/电机/电控
2. `schema/unified_schema.md` — conventions and reference documentation
3. `$ARGUMENTS/data_table_input.json` — has 3 sheets (电池/电机/电控), each with `headers` + `rows` **May not exist — skip if missing.**
4. `$ARGUMENTS/三电参数.json` — nested JSON with vehicle info + 电机/电池/电控 sections. **May not exist — skip if missing.**

## Step 2: Map DT rows (data_table_input)

For each sheet in `data_table_input.json`:

1. **Match sheet name** to the corresponding domain in the schema (电池/电机/电控).
2. **For each row**, map each source key to a canonical column:
   - Use the `aliases` in `unified_schema.json` as primary reference. If a source key appears in any DT alias list, map it to that canonical column.
   - Use **semantic reasoning** for keys not in alias lists — if a key clearly maps to a canonical column by meaning, map it; otherwise drop it.
   - Admin columns (`送样日期`, `签发日期`, `change_status`) map directly.
3. **Handle `_N` suffixed source keys**: See "Dual-Motor Handling" in `unified_schema.md`.
4. **Collect dropped keys**: Any source key that didn't map to a canonical column → add to the dropped keys list for this domain/row.
5. **Wrap values and omit empties**: See "Cell Value Convention" and "Empty Value Handling" in `unified_schema.md`.

## Step 3: Map SP row (三电参数)

Skip this step if `三电参数.json` does not exist.

### 通用 domain
Extract 车辆名称 and 车辆型号 from the top-level `车辆基本信息` or `车辆信息` section. Use SP alias paths in `unified_schema.json` as guide. Build a single row (no admin columns for 通用).

### 电池/电机/电控 domains
For each domain:

1. **Extract relevant fields** from the nested JSON. Use the `SP` alias paths in `unified_schema.json` as a guide — they use dot-separated paths like `电池单体.电池单体型号` or `电机.后轮驱动电机.驱动电机型号`.
2. **Build one row per domain** with admin columns `签发日期 = {"_1": "声明参数"}`, `change_status = {"_1": "declared"}`.
3. **Handle dual-motor and unit conversion**: See `unified_schema.md`.

## Step 4: Write dropped_keys.json

Write all dropped keys to `$ARGUMENTS/dropped_keys.json`:

```json
{
  "电池": {
    "row_0": ["报告编号_1", "报告编号_2", "检验依据_1", ...],
    "row_1": [...]
  },
  "电机": { ... },
  "电控": { ... }
}
```

Keyed by domain → `row_N` → list of dropped key names. Omit domains/rows with no dropped keys.

## Step 5: Assemble and write unified_schema_result.json

For each domain (通用/电池/电机/电控):

1. **Columns**: Use the `columns` array from `unified_schema.json` for that domain.
2. **Rows**:
   - **通用**: Single SP row only (no DT rows, no admin columns).
   - **电池/电机/电控**: DT rows first (sorted per `unified_schema.md` "DT Row Sorting"), then SP row last (if it has data).
3. **Output format**:

```json
{
  "通用": {
    "columns": ["车辆名称", "车辆型号"],
    "rows": [
      {"车辆名称": {"_1": "纯电动轿车"}, "车辆型号": {"_1": "TSL7000BEVBA5"}}
    ]
  },
  "电池": {
    "columns": ["送样日期", "签发日期", "change_status", "单体.型号", ...],
    "rows": [
      {"送样日期": {"_1": "2020-12-14"}, "签发日期": {"_1": "2021-04-14"}, ...},
      {"签发日期": {"_1": "声明参数"}, "change_status": {"_1": "declared"}, ...}
    ]
  },
  "电机": { ... },
  "电控": { ... }
}
```

4. **Write** to `$ARGUMENTS/unified_schema_result.json`.

Print: `[Done] unified_schema_result.json written with 4 domains, dropped_keys.json written`
