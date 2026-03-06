---
name: vision-extract
description: Extract text from PDF reports using Claude Vision API. Processes pages in parallel, files in parallel (up to 5 concurrent).
argument-hint: <vision_manifest.json path>
---

# Vision Extract

Process a `vision_manifest.json` — calls `vision_tool.py` which sends PDF pages to Claude Vision API in parallel.

## Usage

```
/vision-extract <path_to_vision_manifest.json>
```

## What it does

Run this command:

```bash
source .venv/bin/activate && python vision_tool.py "$ARGUMENTS"
```

- Reads the manifest (array of `{pdf_path, output_dir, report_id}`)
- Processes up to 5 PDFs concurrently, all pages within each PDF in parallel
- Each page is sent to Claude Vision API (`claude-sonnet-4-6`) for structured text extraction
- Writes `{report_id}_raw.txt` per PDF, pages in order
- Skips PDFs where `_raw.txt` already exists
- Requires `ANTHROPIC_API_KEY` in `.env` or environment
