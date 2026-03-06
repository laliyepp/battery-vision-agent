---
name: special-reason-history-excel-batch
description: Read history_reason_manifest.json and batch-invoke /special-reason-history-excel-unified-schema for each entry, dispatching sub-agents in parallel by subfolder group.
argument-hint: <history_reason_manifest.json>
---

# Special Reason History Excel Batch

Read a `history_reason_manifest.json` file, group entries by subfolder, and dispatch sub-agents in parallel to process each group via `/special-reason-history-excel-unified-schema`.

## Arguments

- `$ARGUMENTS` — Path to `history_reason_manifest.json`

## Process

### Step 1 — Read and validate manifest

Read the `history_reason_manifest.json` file. If it's empty (`[]`), print `[Skip] No entries in history_reason_manifest.json` and stop.

### Step 2 — Group entries by subfolder_id

Group the manifest entries by their `subfolder_id`. Each group represents one historical application/change folder.

### Step 3 — Dispatch sub-agents in parallel

Use the Agent tool to dispatch sub-agents. Each sub-agent processes one or more subfolder groups. For each entry in its assigned group(s), the sub-agent invokes:

```
/special-reason-history-excel-unified-schema <markdown_path> <output_dir> <report_id> <application_date>
```

Launch sub-agents in parallel (up to ~5 concurrent) for independent groups. If a single subfolder group has multiple entries, they can be processed sequentially within one sub-agent.

Print progress before dispatching:

```
[N/total] Dispatching <subfolder_id> (<M> entries)
```

### Step 4 — Print summary

After all sub-agents complete:

```
=== Special Reason History Excel Batch Summary ===
Processed:
  - 20190911010892B4 (1 entry)
  - 20190911010892B10 (1 entry)
Failed:
  - <subfolder_id>: <error>
Total: N entries across M subfolders
```

## Rules

- Use absolute paths from the manifest — do not modify them
- Do not fail the entire batch on a single entry error — report and continue
- Process in subfolder_id sorted order
- Each sub-agent should be given clear context: the skill to invoke and the exact arguments
