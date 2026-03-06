---
name: chain-extract
description: Chain all 5 extraction steps for a single subfolder — invokes parse-params, build-manifest, vision-extract, build-reason-manifest, and reason-json skills in sequence.
argument-hint: <root_excel> <test_plan_xls> <report_dir> <output_dir> <subfolder>
---

# Chain Extract

Run the full 5-step extraction pipeline for one subfolder by invoking existing skills in sequence.

## Arguments

- `$0` — Path to the root Excel file (.xlsx or .xls), or `no` to skip step 1
- `$1` — Path to the test plan Excel file (.xls or .xlsx)
- `$2` — Path to the directory containing PDF report files
- `$3` — Output base directory (e.g., `output/<vehicle_id>`)
- `$4` — Subfolder name (e.g., `initial`, `change1`, `change2`)

## Steps

Execute these 5 skills sequentially using the Skill tool. Wait for each to complete before starting the next.

### Step 1
```
Skill: parse-params
Args: $0 $3
```

### Step 2
```
Skill: build-manifest
Args: $1 $2 $3/$4
```

### Step 3
```
Skill: vision-extract
Args: $3/$4/vision_manifest.json
```

### Step 4
```
Skill: build-reason-manifest
Args: $3/$4
```

### Step 5
```
Skill: reason-json
Args: $3/$4/reason_manifest.json
```

## Rules

- Run steps in order — each depends on the previous step's output
- If `$0` is `no`, skip step 1
- If step 2 produces an empty manifest `[]`, skip steps 3-5 and report that no PDFs were found
- Print `[Step N/5]` before each skill invocation
