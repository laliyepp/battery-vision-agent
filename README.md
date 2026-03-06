# Battery Vision Agent

Research tool for extracting battery (电池), motor (电机), and electronic control (电控) parameters from Chinese CCC vehicle certification documents.

## Setup

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key for Vision extraction and API-mode reasoning |
| `REASON_MODEL` | No | `claude-sonnet-4-6` | Model used for API-mode reasoning (`reason_tool.py`) |

## Usage

This project is orchestrated via [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills. See `CLAUDE.md` for architecture, pipelines, and skill invocations.
