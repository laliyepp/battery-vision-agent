"""Reasoning extraction tool: read _raw.txt files, call Claude API to extract unified schema JSON.

Supports file-level parallelism (up to FILE_CONCURRENCY files at once).
Mirrors vision_tool.py architecture.
"""

import argparse
import asyncio
import json
import os
from pathlib import Path

import anthropic

# Load .env if present
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

DEFAULT_MODEL = os.environ.get("REASON_MODEL", "claude-sonnet-4-6")
MAX_TOKENS = 16000
FILE_CONCURRENCY = 15

# Load schema once at module level
_schema_path = Path(__file__).parent / "schema" / "unified_schema_v2.json"
SCHEMA = json.loads(_schema_path.read_text(encoding="utf-8"))

# Build empty template from schema
EMPTY_TEMPLATE = {}
for domain, fields in SCHEMA.items():
    EMPTY_TEMPLATE[domain] = {key: "" for key in fields}

SYSTEM_PROMPT = f"""\
You are a data extraction specialist for Chinese CCC vehicle certification documents. \
You extract structured parameters from raw OCR text of test reports into a fixed JSON schema.

## Schema

The output must be a JSON object with exactly 4 domains: 通用, 电池, 电机, 电控. \
Each domain contains specific fields defined below with their descriptions and matching keywords.

```json
{json.dumps(SCHEMA, ensure_ascii=False, indent=2)}
```

## Empty Output Template

Return this exact structure, filling in values where found in the text. \
Every key must be present. Use "" for fields with no data found.

```json
{json.dumps(EMPTY_TEMPLATE, ensure_ascii=False, indent=2)}
```

## Extraction Rules

### Structure
- ALL schema keys must appear in the output — use "" for fields with no data found.
- No extra keys beyond what the schema defines.
- No nested objects — flat key-value pairs within each domain.
- All values are strings — even numbers (e.g., "220" not 220).

### Finding Values
- Use each field's `description` to understand what information belongs there.
- Use the `keywords` to locate matching labels/fields in the raw text.
- Only fill in data that is explicitly stated in the raw text. Do NOT guess or infer.

### Multi-Value Handling
- When a report covers multiple components of the same type (e.g., front and rear motors, or AC and DC charging sockets), use "||" to separate values.
- Keep the order synced across all related columns. For dual motors: front first, rear second. For charging: AC first, DC second if in same field.
- If only one component exists, do NOT use "||".

### Domain Classification
- 电机控制器 data belongs in 电控, NOT 电机, even when it appears in a motor test report.
- BMS data belongs in 电池.
- 通用 fields (车辆名称, 型号, dates, 受检单位, etc.) apply to every report type.

### Data Quality
- Normalize dates to YYYY-MM-DD format. For date ranges: "YYYY-MM-DD 至 YYYY-MM-DD".
- If the schema column includes a unit suffix (e.g., _kW, _V, _Ah, _kg, _mm, _rpm, _Nm, _A), write only the numeric value as a string, stripping the unit from the value.
- Preserve Chinese text exactly as it appears.
- Do NOT fill 检测报告文件名 — it will be set automatically.

### Response Format
- Return ONLY the JSON object. No markdown fencing, no explanation, no extra text.
"""


def extract_json(text: str) -> dict:
    """Extract a JSON object from text, handling markdown fencing and surrounding text."""
    text = text.strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Strip markdown fencing
    if text.startswith("```"):
        first_nl = text.index("\n")
        text = text[first_nl + 1:]
    if text.endswith("```"):
        text = text[:-3].rstrip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first { and last }
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError(f"Could not extract JSON from response:\n{text[:300]}...")


async def process_entry(
    client: anthropic.AsyncAnthropic,
    model: str,
    raw_txt_path: str,
    output_dir: str,
    report_id: str,
    index: int,
    total: int,
) -> None:
    """Process one _raw.txt: send to API, parse JSON, write _unified_output.json."""
    out_path = Path(output_dir) / f"{report_id}_unified_output.json"
    if out_path.exists():
        print(f"  [{index}/{total}] SKIP {report_id} (already exists)")
        return

    raw_text = Path(raw_txt_path).read_text(encoding="utf-8")
    print(f"  [{index}/{total}] {report_id}: {len(raw_text)} chars → API ({model})...", flush=True)

    message = await client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Report ID: {report_id}\n\n{raw_text}",
            }
        ],
    )

    # Find the text block (skip thinking blocks)
    response_text = None
    for block in message.content:
        if block.type == "text":
            response_text = block.text
            break
    if not response_text:
        raise ValueError("No text block in API response")

    result = extract_json(response_text)

    # Validate and ensure all keys present
    for domain in EMPTY_TEMPLATE:
        if domain not in result:
            result[domain] = dict(EMPTY_TEMPLATE[domain])
        else:
            for key in EMPTY_TEMPLATE[domain]:
                if key not in result[domain]:
                    result[domain][key] = ""
                elif not isinstance(result[domain][key], str):
                    result[domain][key] = str(result[domain][key])
            # Remove extra keys
            extra = set(result[domain].keys()) - set(EMPTY_TEMPLATE[domain].keys())
            for key in extra:
                del result[domain][key]
    # Remove extra domains
    extra_domains = set(result.keys()) - set(EMPTY_TEMPLATE.keys())
    for d in extra_domains:
        del result[d]

    # Auto-set report filename
    result["通用"]["检测报告文件名"] = report_id

    # Write output
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  [{index}/{total}] {report_id}: done")


async def main(manifest_path: str, model: str) -> None:
    manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    if not manifest:
        print("Empty manifest, nothing to process.")
        return

    print(f"Processing {len(manifest)} files (model={model}, concurrency={FILE_CONCURRENCY})\n")

    client = anthropic.AsyncAnthropic()
    semaphore = asyncio.Semaphore(FILE_CONCURRENCY)

    async def process_with_limit(entry: dict, index: int) -> None:
        async with semaphore:
            try:
                await process_entry(
                    client,
                    model,
                    entry["raw_txt_path"],
                    entry["output_dir"],
                    entry["report_id"],
                    index,
                    len(manifest),
                )
            except Exception as e:
                print(f"  [{index}/{len(manifest)}] ERROR {entry['report_id']}: {e}")

    tasks = [
        process_with_limit(entry, i + 1)
        for i, entry in enumerate(manifest)
    ]
    await asyncio.gather(*tasks)

    print(f"\nAll done. {len(manifest)} files processed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract unified schema from raw text via Claude API")
    parser.add_argument("manifest", help="Path to reason_manifest.json")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model to use (default: {DEFAULT_MODEL})")
    args = parser.parse_args()
    asyncio.run(main(args.manifest, args.model))
