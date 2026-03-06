---
name: reason-text-unified-schema-api
description: Extract structured data from raw text files into the unified schema format using the Claude API directly (parallel, fast). Each _raw.txt produces one _unified_output.json.
argument-hint: <reason_manifest.json path>
---

# Reason Text Unified Schema — API Mode

Run `reason_tool.py` to process a `reason_manifest.json` using direct Claude API calls with parallel file processing.

## Argument

- `$ARGUMENTS` — Absolute path to the `reason_manifest.json` file

## Process

1. Activate the virtual environment and run the tool:

```bash
source .venv/bin/activate && python reason_tool.py "$ARGUMENTS"
```

2. Report the results (number of files processed, any errors).

## Notes

- This is the fast API-based alternative to `/reason-text-unified-schema` (which uses Claude Code subagents).
- Processes up to 5 files concurrently via asyncio.
- Skips files where `_unified_output.json` already exists.
- Output format is identical to `/reason-text-unified-schema`.
