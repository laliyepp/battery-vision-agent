---
name: run-batch-queue
description: Process unprocessed vehicles from current_execution.md, skipping already-completed ones.
---

# Run Batch Queue

Read `current_execution.md` from the project root. Skip already-processed vehicles, then process the remaining ones sequentially — invoking the skill directly in the main conversation for each vehicle.

Never run vehicles in parallel. Use your main agent to run each vehicle sequentially.

The user maintains `current_execution.md` themselves with `/chain-extract-batch` commands to process.

## Process

### Step 1 — Read and parse `current_execution.md`

1. Read `current_execution.md` from the project root
2. Extract all lines that start with `/chain-extract-batch` (skip comments and blank lines)
3. For each line, parse out the three arguments: `<input_dir>`, `<output_dir>`, and `<mode>`

### Step 2 — Determine which vehicles are already processed

For each parsed command, check if `<output_dir>/merged_final_result.json` exists using a single Bash command (e.g., a loop).

A vehicle is **processed** if that file exists. Otherwise it is **unprocessed**.

Print a status summary:

```
=== Batch Queue Status ===
Total commands: <total>
Already processed: <count>
Remaining: <count>
```

If there are zero unprocessed commands, print `[Done] All vehicles have been processed.` and stop.

### Step 3 — Process loop

1. Take the **first** unprocessed command
2. Extract the vehicle ID from the input directory path (the last path component)
3. Print: `[i/total_remaining] Processing vehicle <vehicle_id>...`
4. Invoke the **Skill** tool directly:
   - `skill: "chain-extract-batch"`
   - `args: "<input_dir> <output_dir> <mode>"`
5. Wait for the skill to complete
6. Check if `<output_dir>/merged_final_result.json` was created to confirm success
7. Print a brief status: `<vehicle_id>: SUCCESS` or `<vehicle_id>: FAILED — <reason>`
8. If the skill errors, log the error and continue to the next vehicle (do NOT stop the batch)
9. Re-read `current_execution.md`, re-check which are processed, and repeat from step 3.1

### Step 4 — Final summary

When all commands in `current_execution.md` are processed:

```
=== Batch Complete ===
All vehicles in current_execution.md have been processed.
```

### Step 5 — Loop back to Step 1

## Rules

- invoke `/chain-extract-batch` directly via the Skill tool in the main conversation
- Please respect the cc/api mode specified in the command arguments when invoking the skill
- Do NOT run vehicles in parallel — run them **sequentially** (one at a time)
- Do NOT stop the batch on individual vehicle errors — log the error and continue
- When checking for processed vehicles, use a single Bash command to check all output dirs efficiently (e.g., a loop), rather than one Glob per vehicle
- The user manages `current_execution.md` — do NOT create or delete it