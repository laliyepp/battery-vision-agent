---
name: vision-extract-batch
description: Search all subfolders under a directory for vision_manifest.json files and batch-invoke /vision-extract for each one.
argument-hint: <vehicle_output_dir>
---

# Vision Extract Batch

Search a vehicle output directory for all `vision_manifest.json` files in subfolders and invoke `/vision-extract` for each one.

## Arguments

- `$0` — Vehicle output directory (e.g., `output/2021011101404763/`)

## Process

### Step 1 — Find all vision manifests

Use Glob to search for `$0/**/vision_manifest.json`. Sort results by path (so `initial` is processed before `change1`, `change2`, etc.).

### Step 2 — Filter empty manifests

Read each `vision_manifest.json`. Skip any that contain an empty array `[]` — print a skip message for these.

### Step 3 — Invoke `/vision-extract` for each manifest

Process sequentially. For each non-empty manifest, print a progress line:

```
[N/total] Processing <subfolder_name> (<M> PDFs)
```

Then invoke:

```
/vision-extract <absolute_path_to_vision_manifest.json>
```

If one invocation fails, report the error and continue with the next.

### Step 4 — Print summary

```
=== Vision Extract Batch Summary ===
Processed:
  - initial (10 PDFs)
  - change2 (5 PDFs)
Skipped (empty manifest):
  - change1
```

## Rules

- Use absolute paths for all invocations
- Process in sorted path order
- Do not fail the entire batch on a single manifest error — report and continue
- Skip empty manifests (`[]`) with a clear message
