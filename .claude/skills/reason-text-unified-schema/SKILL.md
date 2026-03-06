---
name: reason-text-unified-schema
description: Extract structured data from raw text files directly into the unified schema format. Each _raw.txt produces one JSON output with ALL canonical schema keys.
argument-hint: <reason_manifest.json path>
---

# Reason JSON — Unified Schema

Read a `reason_manifest.json` file and process every `_raw.txt` listed in it. For each file, extract data **directly into the canonical unified schema structure** defined in `schema/unified_schema_v2.json`.

## Argument

- `$ARGUMENTS` — Absolute path to the `reason_manifest.json` file

## Manifest Format

```json
[
  {
    "raw_txt_path": "/absolute/path/to/{report_id}_raw.txt",
    "output_dir": "/absolute/path/to/output/folder",
    "report_id": "report_stem"
  }
]
```

## Process

1. **Read the schema**: Read `schema/unified_schema_v2.json` from the project root. This defines all 4 domains (通用, 电池, 电机, 电控) with their fields, descriptions, and keywords.

2. **Read the manifest**: Parse the JSON array from `$ARGUMENTS`.

3. **For each entry** in the manifest:

   a. **Skip check**: If `{output_dir}/{report_id}_unified_output.json` already exists, skip this entry.

   b. **Read** the `_raw.txt` file.

   c. **Initialize** the output template — a JSON object with all 4 domains, each containing every schema key set to `""`.

   d. **Auto-fill**: Set `通用.检测报告文件名` = `report_id`.

   e. **Extract**: Reason through the raw text to fill in values. For each schema field:
      - Use the `description` to understand what kind of information belongs there.
      - Use the `keywords` to locate matching fields/labels in the raw text.
      - If the raw text contains a clear, explicit value for the field, fill it in as a string.
      - If no matching data is found, leave the value as `""`.

   f. **Write** the completed JSON to `{output_dir}/{report_id}_unified_output.json`.

   g. **Print**: `[N/total] Unified: {report_id}_unified_output.json`

4. **Print**: `[Done] N files processed`

## Output Format

Every output file has the **exact same structure** — all 4 domains, all keys present:

```json
{
  "通用": {
    "车辆名称": "纯电动轿车",
    "车辆型号": "TSL7000BEVBA3",
    "检测报告文件名": "QA20E21X99861-3D6",
    "受检单位": "特斯拉（上海）有限公司",
    "生产单位": "特斯拉（上海）有限公司",
    "检验单位": "国家轿车质量监督检验中心",
    "检验类别": "强制性检验",
    "检验依据": "GB/T 18488.1-2015, GB/T 18488.2-2015",
    "送样日期": "2020-09-25",
    "签发日期": "2020-12-21",
    "检验日期": "2020-09-28 至 2020-12-18"
  },
  "电池": {
    "单体.型号": "",
    "单体.生产企业": "",
    ...all battery keys present, "" if not found...
  },
  "电机": {
    "电机.型号": "3D6",
    "峰值功率_kW": "220",
    ...
  },
  "电控": {
    "电机控制器.型号": "3D6",
    ...
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
- When a single report covers multiple components of the same type (e.g., front and rear motors, or multiple charging sockets), use `||` to separate values.
- **Keep the order synced** across all related columns. For dual motors: always put the front motor first, rear motor second. If front/rear is not labeled, use document order.
- Example: `"电机.型号": "3D3||3D6"`, `"峰值功率_kW": "137||220"`, `"电机.生产企业": "特斯拉（上海）有限公司||特斯拉（上海）有限公司"`.
- If only one component exists, do NOT use `||` — just write the single value.

### Domain Classification
- **电机控制器** data belongs in the **电控** domain, NOT 电机, even when it appears in a motor test report.
- **BMS** data belongs in the **电池** domain.
- **通用** fields (车辆名称, 型号, dates, 受检单位, etc.) apply to every report type.

### Data Quality
- **Do not guess or infer** values. Only fill in data that is explicitly stated in the raw text.
- **Normalize dates** to YYYY-MM-DD format. For date ranges, use `"YYYY-MM-DD 至 YYYY-MM-DD"`.
- **Preserve units** as they appear. If the schema column already includes a unit suffix (e.g., `_kW`, `_V`), write only the numeric value as a string.
- **Skip** entries where `_unified_output.json` already exists (do not re-process).
