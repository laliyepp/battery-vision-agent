# Plan: Architecture Presentation Deck

## Context
Create a PowerPoint deck showcasing the project's architecture and AI-native design philosophy. Audience: senior tech lead/architect + business stakeholder. Total: 10 slides.

## Approach
Use the `/pptx` skill to generate the deck. Output: `battery_vision_agent_architecture.pptx` in project root.

## Slide Outline (10 slides)

### Slide 1: Title
**AI-Native Document Intelligence — Schema-Driven Extraction Through Semantic Understanding**
- Subtitle: "A pipeline built entirely on Claude Code Skills"
- Professional tone, no product advertising

### Slide 2: The Problem
**Ad-Hoc Structured Data: Every Subfolder Is Different**
- Each vehicle's certification data lives in subfolders with inconsistent structure
- Same type of document may have different naming, layout, column order across subfolders
- No two labs produce reports in the same format — tables vary, fields move, terminology differs
- 100+ parameters across 4 domains hidden in scanned PDFs, Excel sheets, legacy .xls files
- Cannot hardcode a solution: the inconsistency across subfolders makes deterministic workflows impractical

### Slide 3: Why AI-Native?
**Semantic Understanding Handles What Deterministic Logic Cannot**
- Traditional approach: OCR → regex → field mapping — breaks every time structure changes
- With ad-hoc structured inputs, building a deterministic workflow requires anticipating every variation — an impossible maintenance burden
- AI-native approach: the system reads and understands documents the way a domain expert would
- Adapts to whatever folder structure, document layout, or naming convention it encounters
- No extraction rules in code — all intelligence lives in the schema and natural language skill definitions

### Slide 4: Skill Composition — The Foundation
**Atomic → Batch → Chain: Claude Code Skills as the Orchestration Layer**
- Everything runs through Claude Code Skills (CC mode is the default)
- Atomic skills: single operations — /vision-extract, /build-manifest, /reason-text-unified-schema
- Batch skills: loop over subfolders — /vision-extract-batch, /build-manifest-batch
- Chain skills: orchestrate full pipelines — /chain-extract-batch (6 steps end-to-end)
- Skills are defined in natural language markdown (SKILL.md), not Python code
- Each skill is composable — batch skills invoke atomic skills, chain skills invoke batch skills

### Slide 5: Architecture Overview
**Two Layers, Clear Separation**
- Layer 1 — Python Tools (6 files, stateless, domain-agnostic):
  - vision_tool.py, reason_tool.py, merge_unified_tool.py, validate_unified_output.py, excel_to_markdown.py, generate_reason_manifest.py
- Layer 2 — Claude Code Skills (23 skills, natural language orchestration):
  - Compose tools into pipelines via JSON manifest contracts
  - Skills handle all semantic decisions; tools handle I/O and API calls
- Clean separation: tools know nothing about the domain; skills carry the domain intelligence

### Slide 6: Canonical Schema — Single Source of Truth
**101 Fields, 4 Domains, Zero Code Changes**
- unified_schema_v2.json: General (11), Battery (34), Motor (19), E-Control (37)
- Each field has description and keywords — both serve as semantic hints that guide Claude's understanding of what to extract and where to look for it
- The schema drives everything: skills read it to know what fields to extract, validation checks outputs against it, and the merge tool uses it to structure the final Excel columns
- Adding a new extraction target = adding one JSON entry to the schema. No code changes anywhere.

### Slide 7: Two-Stage Extraction
**Vision → Reasoning: Separation of Concerns at the AI Level**
- Stage 1 — Vision: PDF pages → PNG → Vision API → raw structured text (layout understanding)
- Stage 2 — Reasoning: Claude Code skill reads raw text + schema → reasons semantically → unified JSON
  - Uses CC native solution: the skill itself performs the reasoning through Claude Code's built-in capabilities
- Benefits: independent debugging (is it a Vision problem or a Reasoning problem?), each stage can evolve independently
- Semantic fallback: when test plan doesn't match PDFs, the skill reads the first page and classifies relevance semantically

### Slide 8: Manifest-Driven Orchestration
**JSON Manifests as Pipeline Contracts**
- Each step produces a JSON manifest consumed by the next step
- Manifest chain: vision_manifest.json → _raw.txt files → reason_manifest.json → _unified_output.json
- Steps independently testable, pausable, resumable
- Easy to inspect intermediate state — fully transparent, no black box
- New steps insertable without changing existing ones

### Slide 9: Output & Validation
**Structured Deliverables with Built-In Quality Checks**
- Per-document: _unified_output.json — all 101 schema fields across 4 domains
- Per-vehicle: merged_final_result.json (merged array) + merged_final_result.xlsx (4-sheet workbook: General, Battery, Motor, E-Control)
- Excel output: styled headers, frozen panes, auto-width, source traceability column
- Agent-level validation: after each extraction, the skill verifies all 101 keys are present, removes any hallucinated extra keys, and ensures consistent data types

### Slide 10: Summary
**Key Takeaways**
- Built entirely on Claude Code Skills — atomic, batch, and chain skills compose into full pipelines
- Handles ad-hoc structured inputs: semantic understanding replaces brittle deterministic workflows
- Schema-as-specification: one JSON file drives extraction, validation, and output structure
- Two-stage AI extraction: Vision for layout understanding, Claude Code reasoning for semantic extraction
- Manifest-driven orchestration: transparent, resumable, composable pipeline
- 23 composable skills defined in natural language, not code

## Implementation
1. Invoke /pptx skill to create the deck
2. Output file: battery_vision_agent_architecture.pptx in project root

## Key Source Files Referenced
- schema/unified_schema_v2.json — canonical schema
- vision_tool.py — Vision API extraction engine
- reason_tool.py — reasoning engine
- merge_unified_tool.py — merge + Excel output
- .claude/skills/chain-extract-batch/SKILL.md — master orchestrator skill
- .claude/skills/build-manifest/SKILL.md — manifest building with semantic fallback

## Verification
- Open the generated .pptx file and verify all 10 slides are present
- Check slide content matches the outline above
- Ensure readability for both technical and business audiences
