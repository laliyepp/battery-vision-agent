# Plan: History Parameter Extraction Pipeline (special- prefix)

## Context

Process historical change records from `<vehicle_input_dir>/4-历次申请及变更/`. Each subfolder contains parameter Excel files (same format as the root Excel) and an `申请信息.pdf` with the application date. New decoupled Claude Code skills with `special-` prefix.

## New Skills (4 total)

| # | Skill | Invocation | Purpose |
|---|-------|-----------|---------|
| 1 | `special-scan-history-excels` | `/special-scan-history-excels <vehicle_input_dir> <output_dir>` | Semantically explore all subfolders, find Excels + dates → `history_manifest.json` |
| 2 | `special-reason-history-excel-unified-schema` | `/special-reason-history-excel-unified-schema <excel_path> <output_dir> <report_id> <application_date>` | Process ONE Excel → one `_unified_output.json` |
| 3 | `special-reason-history-excel-batch` | `/special-reason-history-excel-batch <history_manifest.json>` | Read manifest, group by subfolder, dispatch sub-agents in parallel |
| 4 | `special-chain-history-extract` | `/special-chain-history-extract <vehicle_input_dir> <output_dir>` | Chain: scan → batch-reason → merge |

Merge reuses existing `/merge-unified-table`.

## Manifest Format: `history_manifest.json`

```json
[
  {
    "subfolder_id": "20190911010892B10",
    "excel_path": "/abs/path/参数表附件整车参数_2020091101021431_26667398.xls",
    "report_id": "参数表附件整车参数_26667398",
    "output_dir": "/abs/path/output/<vehicle_id>/history/20190911010892B10",
    "application_date": "2020-08-31"
  }
]
```

## Output Structure

```
output/<vehicle_id>/
  history_manifest.json
  history/
    20190911010892B4/
      参数表附件整车参数_25484138_unified_output.json
    20190911010892B10/
      参数表附件整车参数_26667398_unified_output.json
      ...
  merged_final_result.json
  merged_final_result.xlsx
```

## Skill Specifications

### Skill 1: `special-scan-history-excels`
- Args: `$0` = vehicle input folder, `$1` = output dir
- Broad Glob search for ALL subdirs under the history folder (no hardcoded paths)
- For each subfolder: recursively search for `*整车参数*.xls` and `申请信息.pdf`
- Use semantic understanding to identify parameter Excels vs other Excels
- Extract date from 申请信息.pdf via pymupdf one-liner
- Write `$1/history_manifest.json`, create output dirs

### Skill 2: `special-reason-history-excel-unified-schema`
- Args: `$0` = excel_path, `$1` = output_dir, `$2` = report_id, `$3` = application_date
- Same logic as `reason-excel-unified-schema` but:
  - Output: `$1/$2_unified_output.json` (not `三电参数_unified_output.json`)
  - `检测报告文件名` = `$2` (not `"declared"`)
  - `签发日期` = `$3` (not empty)

### Skill 3: `special-reason-history-excel-batch`
- Args: `$ARGUMENTS` = path to `history_manifest.json`
- Group entries by subfolder_id
- Dispatch sub-agents (Agent tool) in parallel, each handling one or more groups
- Each sub-agent invokes `/special-reason-history-excel-unified-schema` per entry

### Skill 4: `special-chain-history-extract`
- Args: `$0` = vehicle input folder, `$1` = output dir
- Step 1: `/special-scan-history-excels $0 $1`
- Step 2: `/special-reason-history-excel-batch $1/history_manifest.json`
- Step 3: `/merge-unified-table $1`

## Files to Create
1. `.claude/skills/special-scan-history-excels/SKILL.md`
2. `.claude/skills/special-reason-history-excel-unified-schema/SKILL.md`
3. `.claude/skills/special-reason-history-excel-batch/SKILL.md`
4. `.claude/skills/special-chain-history-extract/SKILL.md`

## Files to Modify
5. `CLAUDE.md` — Add new skills to tables

## Reference Files
- `.claude/skills/reason-excel-unified-schema/SKILL.md` — Template for skill 2
- `.claude/skills/chain-extract-batch/SKILL.md` — Chain pattern for skill 4
- `schema/unified_schema_v2.json` — Canonical schema
- `merge_unified_tool.py` — Reused via `/merge-unified-table`
