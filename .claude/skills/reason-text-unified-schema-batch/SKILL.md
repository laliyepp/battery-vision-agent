---
name: reason-text-unified-schema-batch
description: Search all subfolders under a directory for reason_manifest.json files and batch-invoke /reason-text-unified-schema for each one.
argument-hint: <vehicle_output_dir> [api|cc]
---

# Reason Text Unified Schema Batch

Search a vehicle output directory for all `reason_manifest.json` files in subfolders and invoke the appropriate reasoning skill for each one.

## Arguments

- `$0` — Vehicle output directory (e.g., `output/2021011101404763/`)
- `$1` — Optional mode: `api` (default) or `cc`
  - `api` → invoke `/reason-text-unified-schema-api` for each manifest (fast, parallel API calls)
  - `cc` → invoke `/reason-text-unified-schema` for each manifest (original Claude Code subagent behavior)

## Process

### Step 1 — Find all reason manifests

Use Glob to search for `$0/**/reason_manifest.json`. Sort results by path (so `initial` is processed before `change1`, `change2`, etc.).

### Step 2 — Filter empty manifests

Read each `reason_manifest.json`. Skip any that contain an empty array `[]` — print a skip message for these.

### Step 3 — Invoke the reasoning skill for each manifest

Determine the mode from `$1` (default: `api` if not provided).

Process sequentially. For each non-empty manifest, print a progress line:

```
[N/total] Processing <subfolder_name> (<M> entries) [mode: api|cc]
```

Then invoke based on mode:

- **`api` mode**: `/reason-text-unified-schema-api <absolute_path_to_reason_manifest.json>`
- **`cc` mode**: `/reason-text-unified-schema <absolute_path_to_reason_manifest.json>`

If one invocation fails, report the error and continue with the next.

### Step 4 — Print summary

```
=== Reason Text Unified Schema Batch Summary ===
Processed:
  - initial (10 entries)
  - change2 (5 entries)
Skipped (empty manifest):
  - change1
```

## Rules

- Use absolute paths for all invocations
- Process in sorted path order
- Do not fail the entire batch on a single manifest error — report and continue
- Skip empty manifests (`[]`) with a clear message
