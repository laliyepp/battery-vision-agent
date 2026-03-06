---
name: build-reason-manifest
description: Scan a single output directory for *_raw.txt files and write reason_manifest.json.
argument-hint: <output_dir_path>
---

# Build Reason Manifest

Scan one output directory for `*_raw.txt` files and write `reason_manifest.json` — the input for `/reason-json`.

## Usage

```
/build-reason-manifest <output_dir_path>
```

## What it does

Run this command:

```bash
source .venv/bin/activate && python generate_reason_manifest.py --dir "$ARGUMENTS"
```

- Globs `*_raw.txt` in the given directory
- Builds a manifest entry per file: `{raw_txt_path, output_dir, report_id}`
- Writes `reason_manifest.json` in that same directory

## Next step

Pass the manifest to:

```
/reason-json <output_dir>/reason_manifest.json
```
