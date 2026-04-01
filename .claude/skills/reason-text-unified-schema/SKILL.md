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

2. **Read the manifest**: Parse the JSON array from `$ARGUMENTS`. Filter out entries where `{output_dir}/{report_id}_unified_output.json` already exists.

3. **Choose processing strategy** based on the number of remaining (non-skipped) entries:
   - **≤5 entries** → process sequentially in the main conversation (Step 4)
   - **>5 entries** → dispatch parallel background agents (Step 5)

4. **Sequential processing** — for each entry:

   a. **Read** the full `_raw.txt` file. You MUST read the entire file — do not stop early or skip sections.

   b. **Initialize** the output template — a JSON object with all 4 domains, each containing every schema key set to `""`. Set `通用.检测报告文件名` = `report_id`.

   c. **Phase 1 — Full Document Survey** (read before extracting):
      Scan the ENTIRE raw text from first page to last. Identify:
      - The report type (motor test, battery test, EMC, EV safety, charging, instrumentation, etc.)
      - Where the **附录** / **样品情况表** / **样品描述** sections are (usually the LAST 1–3 pages)
      - Where test result tables and conclusion statements are

      > **CRITICAL**: The 附录 (appendix) and 样品情况表 (sample details) sections near the END of the document are the PRIMARY source for 电池/电机/电控 component specifications. These sections contain structured tables with battery cell/pack specs, motor specs, controller specs, BMS info, and more. You MUST NOT skip or skim these sections. They are more important than the test result pages for data extraction.

   d. **Phase 2 — Extract 通用 (General) fields**:
      From the cover page (page 1), conclusion page, and header tables, extract:
      `车辆名称`, `车辆型号`, `受检单位`, `生产单位`, `检验单位`, `检验类别`, `检验依据`, `送样日期`, `签发日期`, `检验日期`

   e. **Phase 3 — Extract 电池/电机/电控 fields from 附录 and body**:
      This is the most important phase. Thoroughly scan the 附录/样品情况表 sections AND any specification tables in the report body.

      For EVERY schema field in 电池, 电机, and 电控 domains:
      1. Check the field's `description` and `keywords` list from the schema
      2. Search the raw text (especially 附录 and 样品情况表) for any matching label or semantically equivalent content
      3. If found, extract the value as a string
      4. When a single cell contains combined values (e.g., `电压/容量 | 321.2/153`), split them into the corresponding separate schema fields

      Do this for ALL fields — do not stop after finding a few matches.

   f. **Phase 4 — Extract test conclusions**:
      From test result tables and conclusion statements, extract the relevant `_结论` and `检验结论` fields for each domain.

   g. **Write** the completed JSON to `{output_dir}/{report_id}_unified_output.json`.

   h. **Print**: `[N/total] Unified: {report_id}_unified_output.json`

5. **Parallel batch processing** (when >5 entries remain):

   a. Split the remaining entries into **batches of 5**.
   b. For each batch, launch a **background Agent** with the following prompt:
      - Instruct it to read `schema/unified_schema_v2.json`
      - Give it the list of entries (raw_txt_path, output_dir, report_id) for its batch
      - Instruct it to process each file using the same Phase 1–4 logic described in Step 4
      - Instruct it to write each `_unified_output.json` file
   c. Wait for all background agents to complete.
   d. Verify each expected output file was created.

6. **Print**: `[Done] N files processed`

---

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
    "单体.型号": "LP2714897-51Ah",
    "单体.生产企业": "力神动力电池系统有限公司",
    "单体.种类": "三元材料",
    "单体.额定电压_V": "3.65",
    "单体.额定容量_Ah": "51",
    ...all battery keys present, "" if not found...
  },
  "电机": {
    "电机.型号": "TZ242XS005",
    "电机.生产企业": "北京博格华纳汽车传动器有限公司",
    "电机.型式": "永磁同步驱动电机",
    "持续功率_kW": "60",
    "峰值功率_kW": "120",
    ...
  },
  "电控": {
    "电机控制器.型号": "KTZ32X42SUAES",
    "电机控制器.生产企业": "联合汽车电子有限公司",
    "电机控制器.冷却方式": "液冷",
    "电机控制器.输入电压_V": "321.2",
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
- **Keep the order synced** across all related columns. For dual motors: always put the front motor first, rear motor second.
- **Strip positional prefixes**: When raw text says `前：3D3/后：3D6` or `前电机：3D3、后电机：3D6`, extract as `3D3||3D6`. Do NOT include `前：`, `后：`, `前电机`, `后电机` in the extracted values.
- Example: `"电机.型号": "3D3||3D6"`, `"峰值功率_kW": "137||220"`.
- If only one component exists, do NOT use `||` — just write the single value.

### Domain Classification
- **电机控制器** data belongs in the **电控** domain, NOT 电机, even when it appears in a motor test report.
- **BMS** data belongs in the **电池** domain.
- **通用** fields (车辆名称, 型号, dates, 受检单位, etc.) apply to every report type.

### Data Quality
- **Do not guess or infer** values. Only fill in data that is explicitly stated in the raw text.
- **Normalize dates** to YYYY-MM-DD format. For date ranges, use `"YYYY-MM-DD 至 YYYY-MM-DD"`.
- **Preserve units** as they appear. If the schema column already includes a unit suffix (e.g., `_kW`, `_V`), write only the numeric value as a string.
- **Convert Wh to kWh** for `电池包.额定能量_kWh`: if the raw text gives energy in Wh (e.g., 49143.6 Wh), divide by 1000 and write `"49.1436"`.
- **Skip** entries where `_unified_output.json` already exists (do not re-process).
