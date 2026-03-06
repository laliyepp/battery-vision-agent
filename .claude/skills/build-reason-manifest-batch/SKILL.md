---
name: build-reason-manifest-batch
description: Search all subfolders under a directory for *_raw.txt files and batch-invoke /build-reason-manifest for each subfolder containing them.
argument-hint: <vehicle_output_dir>
---

# Build Reason Manifest Batch

Search a vehicle output directory for all subfolders that contain `*_raw.txt` files and invoke `/build-reason-manifest` for each one.

## Arguments

- `$0` — Vehicle output directory (e.g., `output/2021011101404763/`)

## Process

### Step 1 — Find subfolders with raw text files

Use Glob to search for `$0/**/*_raw.txt`. Group results by their parent directory. Sort directories by path (so `initial` is processed before `change1`, `change2`, etc.).

### Step 2 — Invoke `/build-reason-manifest` for each subfolder

Process sequentially. For each subfolder containing `_raw.txt` files, print a progress line:

```
[N/total] Processing <subfolder_name> (<M> raw files)
```

Then invoke:

```
/build-reason-manifest <absolute_path_to_subfolder>
```

If one invocation fails, report the error and continue with the next.

### Step 3 — Print summary

```
=== Build Reason Manifest Batch Summary ===
Processed:
  - initial (10 raw files)
  - change2 (5 raw files)
Skipped: none
```

## Rules

- Use absolute paths for all invocations
- Process in sorted path order
- Do not fail the entire batch on a single subfolder error — report and continue
