---
name: reason-json
description: Reason through raw text files to extract structured battery/motor/econtrol information into readable JSON. Reads a reason_manifest.json and processes all entries.
argument-hint: <reason_manifest.json path>
---

# Reason JSON

Read a `reason_manifest.json` file and process every `_raw.txt` listed in it. For each file, find all information related to 电池/电机/电控 and produce a clean, readable JSON.

## Argument

- `$ARGUMENTS` — Absolute path to the `reason_manifest.json` file

## Manifest Format

```json
{
  "raw_txt_path": "/absolute/path/to/{report_id}_raw.txt",
  "output_dir": "/absolute/path/to/output/folder",
  "report_id": "report_stem"
}
```

## Process

For each entry in the manifest:

1. Read the `_raw.txt` file.
2. Identify everything related to 生产厂商/电池/电机/电控: parameters, specs, test results, dates, conclusions, sample info — anything relevant.
3. Organize the extracted information into a JSON object with meaningful, human-readable Chinese keys. Group related information logically. Include units where present.
4. Write the JSON to `{output_dir}/{report_id}_reasoning_output.json`.
5. Print progress: `[N/total] Reasoned: {report_id}_reasoning_output.json`
6. Move to next entry.

## Rules

- Keys must be meaningful and readable (e.g., `"电池额定电压_V"`, not `"field_1"`)
- Keep the JSON flat where possible; use nested objects only when grouping makes it clearer
- Normalize dates to YYYY-MM-DD
- Omit empty or irrelevant fields
- Focus on 生产厂商/电池/电机/电控 — ignore unrelated content (e.g., page headers, disclaimers, photo captions)
- Skip entries where the output `_reasoning_output.json` already exists (do not re-process)
