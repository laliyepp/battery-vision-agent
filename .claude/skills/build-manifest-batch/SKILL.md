---
name: build-manifest-batch
description: Scan a vehicle input directory for all application/change subfolders and batch-invoke /build-manifest for each one.
argument-hint: <vehicle_input_dir> <vehicle_output_dir>
---

# Build Manifest Batch

Scan a vehicle's input directory for application and change subfolders, then invoke `/build-manifest` for each valid subfolder that has both a test plan Excel and report PDFs.

## Arguments

- `$0` — Vehicle input directory (e.g., `data/raw_example/2021011101404763/`)
- `$1` — Vehicle output directory (e.g., `output/2021011101404763/`)

## Process

### Step 1 — Discover application/change folders

Recursively search `$0` for directories that represent application or change submissions. Look for folders whose names contain patterns like `初次申请`, `变1`, `变2`, `变3`, etc. — at any depth.

Use Glob patterns like `$0/**/` and filter for folders that look like application rounds (e.g., names containing `初次申请` or `变` followed by a digit).

Sort discovered folders by their numeric prefix (1-, 2-, 3-, ...).

### Step 2 — For each discovered folder, find the triple

For each folder found in Step 1:

**2a. Test plan Excel**: Search within the folder for `.xls`/`.xlsx` files in any subdirectory related to test plans (e.g., containing `方案` in the path or filename). If multiple, prefer filename containing `方案表`. Skip folder if none found.

**2b. Report directory**: Search within the folder for a subdirectory containing PDF files (related to reports — e.g., `检测报告`, `试验报告`). If PDFs exist only in a child sub-subfolder (e.g., `3 试验报告/` or `3-检测报告/`), use that directory. Skip folder if no PDFs found anywhere.

**2c. Output subfolder name**:
- Folder containing `初次申请` → `initial`
- Folder containing `变N` → `changeN` (e.g., `变1` → `change1`, `变2` → `change2`)

### Step 3 — Invoke `/build-manifest` for each valid triple

Process sequentially. For each valid triple, print a progress line:

```
[N/total] Processing <folder_name> → <output_subfolder>
```

Then invoke:

```
/build-manifest <test_plan_xls> <report_dir> $1/<output_subfolder>
```

If one invocation fails, report the error and continue with the next folder.

### Step 4 — Print summary

After all folders are processed, print a summary:

```
=== Build Manifest Batch Summary ===
Processed:
  - 1-初次申请 → initial (N PDFs)
  - 3-变2 → change2 (N PDFs)
Skipped:
  - 2-变1: no test plan found
```

Count PDFs from the generated `vision_manifest.json` for each processed folder.

## Rules

- Use absolute paths for all invocations
- Process folders in sorted order (by numeric prefix)
- Do not fail the entire batch on a single subfolder error — report and continue
- Both a test plan Excel AND a report directory with PDFs are required — skip the subfolder otherwise
- If no valid subfolders are found at all, report that clearly
