---
name: reason-excel-unified-schema
description: Read a root Excel parameter file and extract battery/motor/econtrol data directly into the unified schema format, outputting {report_id}_三电参数_unified_output.json.
argument-hint: <excel_path> <output_dir> [report_id]
---

# Reason Excel — Unified Schema

Read a root-level Excel parameter file and extract all vehicle/battery/motor/econtrol data **directly into the canonical unified schema structure** defined in `schema/unified_schema_v2.json`.

## Arguments

- `$0` — Path to the Excel file (.xlsx or .xls)
- `$1` — Path to the output directory
- `$2` — Optional `report_id` prefix. If provided, output filename is `{report_id}_三电参数_unified_output.json`. If omitted, derive from the `$0` filename stem (e.g., `技术参数-xxx.xlsx` → `技术参数-xxx`).

## Output

- `$1/{report_id}_三电参数_unified_output.json` — Same 4-domain structure as `_unified_output.json` files
- The `report_id` is determined from `$2` if provided, otherwise from the `$0` filename stem.

## Process

1. **Determine output filename**: If `$2` is provided, use `{$2}_三电参数_unified_output.json`. Otherwise, derive from `$0` filename stem: e.g., `技术参数-xxx.xlsx` → `技术参数-xxx_三电参数_unified_output.json`.

2. **Skip check**: If the output file already exists, print `[Skip] {filename} already exists` and stop.

3. **Read the schema**: Read `schema/unified_schema_v2.json` from the project root. This defines all 4 domains (通用, 电池, 电机, 电控) with their fields, descriptions, and keywords.

4. **Read the Excel file**: Use the `/xlsx` skill to read the Excel file. Specifically, use pandas `pd.read_excel()` (handles both `.xlsx` and `.xls` formats) or openpyxl for `.xlsx` files per the xlsx skill conventions. Focus on the `参数信息` sheet (or equivalent parameter sheet).

5. **Initialize** the output template — a JSON object with all 4 domains, each containing every schema key set to `""`.

6. **Auto-fill 通用 domain**:
   - Fill `车辆名称` and `车辆型号` from the Excel data.
   - Fill `生产单位` from the Excel data if available.
   - Set `检测报告文件名` = `"declared"` (this is declared data from Excel, not a test report).
   - Leave report-specific fields as `""`: `受检单位`, `检验单位`, `检验类别`, `检验依据`, `送样日期`, `签发日期`, `检验日期`.

7. **Extract 电池/电机/电控 data**: Reason through the Excel content to fill in values. For each schema field:
   - Use the `description` to understand what kind of information belongs there.
   - Use the `keywords` to locate matching parameters in the Excel data.
   - If the Excel contains a clear, explicit value for the field, fill it in as a string.
   - If no matching data is found, leave the value as `""`.

8. **Write** the completed JSON to `$1/{report_id}_三电参数_unified_output.json`.

9. **Print**: `[Done] {report_id}_三电参数_unified_output.json`

## Output Format

Every output file has the **exact same structure** — all 4 domains, all keys present:

```json
{
  "通用": {
    "车辆名称": "纯电动轿车",
    "车辆型号": "TSL7000BEVBA3",
    "检测报告文件名": "declared",
    "受检单位": "",
    "生产单位": "特斯拉（上海）有限公司",
    "检验单位": "",
    "检验类别": "",
    "检验依据": "",
    "送样日期": "",
    "签发日期": "",
    "检验日期": ""
  },
  "电池": {
    "单体.型号": "...",
    "单体.生产企业": "...",
    ...all battery keys present, "" if not found...
  },
  "电机": {
    "电机.型号": "3D3||3D6",
    "峰值功率_kW": "137||220",
    ...all motor keys present, "" if not found...
  },
  "电控": {
    "电机控制器.型号": "...",
    ...all econtrol keys present, "" if not found...
  }
}
```

## Rules

### Structure
- **ALL schema keys** must appear in every output — use `""` for fields with no data found.
- **No extra keys** beyond what the schema defines.
- **No nested objects** — flat key-value pairs within each domain.
- **All values are strings** — even numbers should be written as strings (e.g., `"220"` not `220`).

### Multi-Value Handling
- When the Excel contains multiple components of the same type (e.g., front and rear motors, or multiple charging sockets), use `||` to separate values.
- **Keep the order synced** across all related columns. For dual motors: always put the front motor first, rear motor second. If front/rear is not labeled, use document order.
- Example: `"电机.型号": "3D3||3D6"`, `"峰值功率_kW": "137||220"`, `"电机.生产企业": "特斯拉（上海）有限公司||特斯拉（上海）有限公司"`.
- If only one component exists, do NOT use `||` — just write the single value.

### Domain Classification
- **电机控制器** data belongs in the **电控** domain, NOT 电机, even when it appears alongside motor parameters in the Excel.
- **BMS** data belongs in the **电池** domain.
- **通用** fields (车辆名称, 型号, 生产单位) apply to the vehicle level.

### Data Quality
- **Do not guess or infer** values. Only fill in data that is explicitly stated in the Excel.
- **Preserve units** as they appear. If the schema column already includes a unit suffix (e.g., `_kW`, `_V`), write only the numeric value as a string.
- **Skip** if the output file already exists (do not re-process).
