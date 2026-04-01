---
name: chain-extract-batch
description: Run the full batch extraction pipeline for a vehicle — invokes chain-reason-excel, build-manifest-batch, vision-extract-batch, build-reason-manifest-batch, reason-text-unified-schema-batch, and merge-unified-table in sequence.
argument-hint: <vehicle_input_dir> <vehicle_output_dir> [api|cc]
---

# Chain Extract Batch

Run the full 6-step batch extraction pipeline for a vehicle by invoking existing skills in sequence.

## Arguments

- `$0` — Vehicle input directory (e.g., `data/certificate/CQC/2022011101503573/`)
- `$1` — Vehicle output directory (e.g., `output/2022011101503573/`)
- `$2` — Optional mode for Step 5: `api` (default) or `cc`

## Steps

Steps 1 and 2 are independent — run them in parallel using the Agent tool. Steps 3-6 run sequentially after Step 2 completes.

### Step 1 — Auto-discover and extract declared parameters from Excel (PARALLEL with Step 2)
```
Skill: chain-reason-excel
Args: $0 $1
```

### Step 2 — Build vision manifests for all subfolders (PARALLEL with Step 1)
```
Skill: build-manifest-batch
Args: $0 $1
```

### Step 3 — Extract text from PDFs via Vision API (after Step 2)
```
Skill: vision-extract-batch
Args: $1
```

### Step 4 — Build reason manifests for all subfolders (after Step 3)
```
Skill: build-reason-manifest-batch
Args: $1
```

### Step 5 — Extract unified schema from raw text (after Step 4)
```
Skill: reason-text-unified-schema-batch
Args: $1 $2
```
(where `$2` defaults to `api` if not provided)

### Step 6 — Merge all unified outputs (after Steps 1 + 5 complete)
```
Skill: merge-unified-table
Args: $1
```

## Rules

- **Steps 1 and 2 run in parallel** — launch both at the same time using the Agent tool, then wait for both to complete
- Steps 3-5 run sequentially after Step 2
- Step 6 runs after both Step 1 and Step 5 are done
- Print `[Step N/6]` before each skill invocation
- Step 5 uses `$2` mode (`api` by default if not provided; `cc` for original Claude Code subagent behavior)
- If step 2 finds no valid subfolders, skip steps 3-5 and proceed to step 6 (which will merge just the declared data)
- If step 3 has no non-empty manifests, skip steps 4-5 and proceed to step 6
- Do not stop the pipeline on errors in individual subfolders — batch skills handle that internally
