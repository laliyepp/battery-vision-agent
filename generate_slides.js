const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Icons
const { FaFolder, FaFileAlt, FaExclamationTriangle, FaDatabase, FaBan,
        FaTimes, FaCheck, FaCog, FaLayerGroup, FaLink, FaCode, FaBrain,
        FaEye, FaArrowRight, FaCheckCircle, FaKey } = require("react-icons/fa");

// === Color Palette ===
const C = {
  DARK_BG: "0F1B2D",
  LIGHT_BG: "F5F7FA",
  CARD: "FFFFFF",
  ACCENT: "0891B2",
  ACCENT_LIGHT: "E0F2FE",
  ACCENT_DARK: "065A82",
  NAVY: "1E3A5F",
  TEXT: "1E293B",
  MUTED: "64748B",
  WHITE: "FFFFFF",
  RED: "DC2626",
  GREEN: "059669",
  TEAL: "0D9488",
};

const H_FONT = "Trebuchet MS";
const B_FONT = "Calibri";

// === Helpers ===
const mkShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.12 });

function renderSvg(Icon, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { color, size: String(size) }));
}
async function iconPng(Icon, color, size = 256) {
  const svg = renderSvg(Icon, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Slide title helper
function addTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.7, y: 0.4, w: 8.6, h: 0.7,
    fontSize: 32, fontFace: H_FONT, color: C.TEXT,
    bold: true, align: "left", margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7, y: 1.0, w: 8.6, h: 0.4,
      fontSize: 14, fontFace: B_FONT, color: C.MUTED,
      align: "left", margin: 0,
    });
  }
}

// Card helper
function addCard(slide, x, y, w, h, accentColor) {
  slide.addShape(slide._slideLayout ? pres.shapes.RECTANGLE : pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: C.CARD }, shadow: mkShadow(),
  });
  if (accentColor) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.06, fill: { color: accentColor },
    });
  }
}

let pres; // global for shape references in helpers

async function main() {
  // Pre-render icons
  const ic = {
    folder: await iconPng(FaFolder, "#" + C.ACCENT),
    file: await iconPng(FaFileAlt, "#" + C.ACCENT),
    warn: await iconPng(FaExclamationTriangle, "#" + C.ACCENT),
    db: await iconPng(FaDatabase, "#" + C.ACCENT),
    ban: await iconPng(FaBan, "#" + C.ACCENT),
    xMark: await iconPng(FaTimes, "#" + C.RED),
    check: await iconPng(FaCheck, "#" + C.GREEN),
    cog: await iconPng(FaCog, "#" + C.ACCENT),
    layers: await iconPng(FaLayerGroup, "#" + C.ACCENT),
    link: await iconPng(FaLink, "#" + C.ACCENT),
    codeW: await iconPng(FaCode, "#FFFFFF"),
    brainW: await iconPng(FaBrain, "#CADCFC"),
    brainT: await iconPng(FaBrain, "#" + C.ACCENT_DARK),
    eye: await iconPng(FaEye, "#" + C.ACCENT),
    arrow: await iconPng(FaArrowRight, "#" + C.ACCENT),
    checkW: await iconPng(FaCheckCircle, "#FFFFFF"),
    key: await iconPng(FaKey, "#" + C.ACCENT),
  };

  pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Battery Vision Agent";
  pres.title = "AI-Native Document Intelligence";

  // ============================================================
  // SLIDE 1 — Title
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.DARK_BG };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.ACCENT } });

    // Decorative circle (subtle background element)
    s.addShape(pres.shapes.OVAL, {
      x: 7.5, y: 1.0, w: 3.5, h: 3.5,
      fill: { color: C.NAVY, transparency: 60 },
    });

    s.addText("AI-Native\nDocument Intelligence", {
      x: 0.8, y: 1.0, w: 7.5, h: 1.8,
      fontSize: 40, fontFace: H_FONT, color: C.WHITE,
      bold: true, align: "left", margin: 0,
    });
    s.addText("Schema-Driven Extraction Through Semantic Understanding", {
      x: 0.8, y: 2.9, w: 7.5, h: 0.5,
      fontSize: 18, fontFace: B_FONT, color: "94A3B8",
      align: "left", margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: 3.65, w: 2.5, h: 0, line: { color: C.ACCENT, width: 2 },
    });
    s.addText("A pipeline built entirely on Claude Code Skills", {
      x: 0.8, y: 3.9, w: 7.5, h: 0.5,
      fontSize: 14, fontFace: B_FONT, color: C.MUTED, align: "left", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 2 — The Problem
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Ad-Hoc Structured Data", "Every Subfolder Is Different");

    const items = [
      { icon: ic.folder, t: "Inconsistent Structure", d: "Each vehicle's certification data lives in subfolders with varying directory layouts and file sets" },
      { icon: ic.file, t: "Format Variation", d: "Same document type has different naming, column order, and table layouts across subfolders" },
      { icon: ic.warn, t: "No Standard Format", d: "No two labs produce reports the same way \u2014 tables vary, fields move, terminology differs" },
      { icon: ic.db, t: "Hidden Parameters", d: "100+ parameters across 4 domains buried in scanned PDFs, Excel sheets, and legacy .xls files" },
      { icon: ic.ban, t: "Cannot Hardcode", d: "Inconsistency across subfolders makes deterministic workflows impractical at scale" },
    ];

    items.forEach((p, i) => {
      const y = 1.7 + i * 0.72;
      s.addShape(pres.shapes.OVAL, { x: 0.7, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: C.ACCENT_LIGHT } });
      s.addImage({ data: p.icon, x: 0.8, y: y + 0.12, w: 0.25, h: 0.25 });
      s.addText(p.t, {
        x: 1.4, y: y, w: 3.5, h: 0.3,
        fontSize: 14, fontFace: B_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
      });
      s.addText(p.d, {
        x: 1.4, y: y + 0.3, w: 7.8, h: 0.3,
        fontSize: 12, fontFace: B_FONT, color: C.MUTED, align: "left", margin: 0,
      });
    });
  }

  // ============================================================
  // SLIDE 3 — Why AI-Native?
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Why AI-Native?", "Semantic Understanding Handles What Deterministic Logic Cannot");

    const colL = 0.7, colR = 5.2, cw = 4.1;

    // Traditional card
    s.addShape(pres.shapes.RECTANGLE, { x: colL, y: 1.7, w: cw, h: 3.3, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: colL, y: 1.7, w: cw, h: 0.06, fill: { color: C.RED } });
    s.addText("Traditional Approach", {
      x: colL + 0.3, y: 1.9, w: cw - 0.6, h: 0.4,
      fontSize: 16, fontFace: H_FONT, color: C.RED, bold: true, align: "left", margin: 0,
    });
    const trad = [
      "OCR \u2192 regex \u2192 field mapping",
      "Breaks every time structure changes",
      "Must anticipate every variation upfront",
      "O(formats \u00d7 fields) maintenance cost",
      "Rigid, predefined processing logic",
    ];
    trad.forEach((t, i) => {
      const y = 2.5 + i * 0.48;
      s.addImage({ data: ic.xMark, x: colL + 0.3, y: y + 0.03, w: 0.18, h: 0.18 });
      s.addText(t, {
        x: colL + 0.6, y: y, w: cw - 1, h: 0.35,
        fontSize: 12, fontFace: B_FONT, color: C.TEXT, align: "left", margin: 0,
      });
    });

    // AI-Native card
    s.addShape(pres.shapes.RECTANGLE, { x: colR, y: 1.7, w: cw, h: 3.3, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: colR, y: 1.7, w: cw, h: 0.06, fill: { color: C.ACCENT } });
    s.addText("AI-Native Approach", {
      x: colR + 0.3, y: 1.9, w: cw - 0.6, h: 0.4,
      fontSize: 16, fontFace: H_FONT, color: C.ACCENT, bold: true, align: "left", margin: 0,
    });
    const ai = [
      "Reads and understands like a domain expert",
      "Adapts to any folder structure or layout",
      "No extraction rules in code",
      "Schema + natural language skills drive all logic",
      "Flexible, semantic understanding",
    ];
    ai.forEach((t, i) => {
      const y = 2.5 + i * 0.48;
      s.addImage({ data: ic.check, x: colR + 0.3, y: y + 0.03, w: 0.18, h: 0.18 });
      s.addText(t, {
        x: colR + 0.6, y: y, w: cw - 1, h: 0.35,
        fontSize: 12, fontFace: B_FONT, color: C.TEXT, align: "left", margin: 0,
      });
    });
  }

  // ============================================================
  // SLIDE 4 — Skill Composition
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Skill Composition", "Atomic \u2192 Batch \u2192 Chain: Claude Code Skills as the Orchestration Layer");

    const cards = [
      {
        icon: ic.cog, title: "Atomic Skills", accent: C.ACCENT,
        desc: "Single operations on one input",
        items: ["/vision-extract", "/build-manifest", "/reason-text-unified-schema"],
      },
      {
        icon: ic.layers, title: "Batch Skills", accent: C.TEAL,
        desc: "Loop over all subfolders automatically",
        items: ["/vision-extract-batch", "/build-manifest-batch", "/reason-...-batch"],
      },
      {
        icon: ic.link, title: "Chain Skills", accent: C.ACCENT_DARK,
        desc: "Orchestrate full 6-step pipeline",
        items: ["/chain-extract-batch", "/special-chain-history-extract", "/chain-extract"],
      },
    ];

    const cw = 2.7, gap = 0.35, sx = 0.7;
    cards.forEach((card, i) => {
      const cx = sx + i * (cw + gap);
      const cy = 1.7;

      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: 3.0, fill: { color: C.CARD }, shadow: mkShadow() });
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: 0.06, fill: { color: card.accent } });

      // Icon in circle
      s.addShape(pres.shapes.OVAL, { x: cx + (cw - 0.55) / 2, y: cy + 0.3, w: 0.55, h: 0.55, fill: { color: C.ACCENT_LIGHT } });
      s.addImage({ data: card.icon, x: cx + (cw - 0.35) / 2, y: cy + 0.4, w: 0.35, h: 0.35 });

      s.addText(card.title, {
        x: cx, y: cy + 1.0, w: cw, h: 0.35,
        fontSize: 15, fontFace: H_FONT, color: C.TEXT, bold: true, align: "center", margin: 0,
      });
      s.addText(card.desc, {
        x: cx + 0.2, y: cy + 1.35, w: cw - 0.4, h: 0.3,
        fontSize: 10, fontFace: B_FONT, color: C.MUTED, align: "center", margin: 0,
      });

      // Skill names
      card.items.forEach((item, j) => {
        s.addText(item, {
          x: cx + 0.15, y: cy + 1.8 + j * 0.32, w: cw - 0.3, h: 0.28,
          fontSize: 10, fontFace: "Consolas", color: C.ACCENT_DARK, align: "center", margin: 0,
        });
      });

      // Arrow after card (except last)
      if (i < cards.length - 1) {
        s.addImage({ data: ic.arrow, x: cx + cw + 0.06, y: cy + 1.15, w: 0.22, h: 0.22 });
      }
    });

    // Bottom note
    s.addText("Skills defined in natural language markdown (SKILL.md), not Python code | CC mode is the default", {
      x: 0.7, y: 4.9, w: 8.6, h: 0.4,
      fontSize: 11, fontFace: B_FONT, color: C.MUTED, italic: true, align: "center", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 5 — Architecture Overview
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Architecture Overview", "Two Layers, Clear Separation");

    // Layer 2 - Skills (top)
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.6, w: 8.6, h: 1.5, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.6, w: 0.08, h: 1.5, fill: { color: C.ACCENT } });
    s.addShape(pres.shapes.OVAL, { x: 1.1, y: 1.8, w: 0.5, h: 0.5, fill: { color: C.ACCENT } });
    s.addImage({ data: ic.brainW, x: 1.18, y: 1.88, w: 0.34, h: 0.34 });
    s.addText("Layer 2 \u2014 Claude Code Skills", {
      x: 1.8, y: 1.75, w: 7, h: 0.35,
      fontSize: 18, fontFace: H_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
    });
    s.addText("16 skills  |  Natural language orchestration  |  Semantic decisions", {
      x: 1.8, y: 2.1, w: 7, h: 0.3,
      fontSize: 12, fontFace: B_FONT, color: C.ACCENT, align: "left", margin: 0,
    });
    s.addText("Compose tools into pipelines via JSON manifest contracts. Handle all domain-specific reasoning.", {
      x: 1.8, y: 2.5, w: 7, h: 0.3,
      fontSize: 12, fontFace: B_FONT, color: C.MUTED, align: "left", margin: 0,
    });

    // Arrow
    s.addText("\u25BC", {
      x: 4.5, y: 3.15, w: 1, h: 0.35,
      fontSize: 20, color: C.ACCENT, align: "center", margin: 0,
    });

    // Layer 1 - Python Tools (bottom)
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 3.5, w: 8.6, h: 1.5, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 3.5, w: 0.08, h: 1.5, fill: { color: C.NAVY } });
    s.addShape(pres.shapes.OVAL, { x: 1.1, y: 3.7, w: 0.5, h: 0.5, fill: { color: C.NAVY } });
    s.addImage({ data: ic.codeW, x: 1.18, y: 3.78, w: 0.34, h: 0.34 });
    s.addText("Layer 1 \u2014 Python Tools", {
      x: 1.8, y: 3.65, w: 7, h: 0.35,
      fontSize: 18, fontFace: H_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
    });
    s.addText("6 files  |  Stateless  |  Domain-agnostic", {
      x: 1.8, y: 4.0, w: 7, h: 0.3,
      fontSize: 12, fontFace: B_FONT, color: C.NAVY, align: "left", margin: 0,
    });
    s.addText([
      { text: "vision_tool.py", options: { fontFace: "Consolas", fontSize: 10, color: C.MUTED, breakLine: false } },
      { text: "  \u00b7  ", options: { fontSize: 10, color: C.MUTED, breakLine: false } },
      { text: "reason_tool.py", options: { fontFace: "Consolas", fontSize: 10, color: C.MUTED, breakLine: false } },
      { text: "  \u00b7  ", options: { fontSize: 10, color: C.MUTED, breakLine: false } },
      { text: "merge_unified_tool.py", options: { fontFace: "Consolas", fontSize: 10, color: C.MUTED, breakLine: false } },
      { text: "  \u00b7  ", options: { fontSize: 10, color: C.MUTED, breakLine: false } },
      { text: "validate_unified_output.py", options: { fontFace: "Consolas", fontSize: 10, color: C.MUTED } },
    ], {
      x: 1.8, y: 4.35, w: 7.2, h: 0.3, margin: 0,
    });

    s.addText("Tools know nothing about the domain; skills carry the domain intelligence", {
      x: 0.7, y: 5.1, w: 8.6, h: 0.3,
      fontSize: 12, fontFace: B_FONT, color: C.MUTED, italic: true, align: "center", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 6 — Canonical Schema
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Canonical Schema", "Single Source of Truth");

    // Stat callouts
    const stats = [
      { num: "101", label: "Fields", accent: C.ACCENT },
      { num: "4", label: "Domains", accent: C.TEAL },
      { num: "0", label: "Code Changes", accent: C.ACCENT_DARK },
    ];
    const sw = 2.7, sg = 0.35;
    stats.forEach((st, i) => {
      const sx = 0.7 + i * (sw + sg);
      s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.6, w: sw, h: 1.4, fill: { color: C.CARD }, shadow: mkShadow() });
      s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.6, w: sw, h: 0.06, fill: { color: st.accent } });
      s.addText(st.num, {
        x: sx, y: 1.72, w: sw, h: 0.7,
        fontSize: 48, fontFace: H_FONT, color: st.accent, bold: true, align: "center", margin: 0,
      });
      s.addText(st.label, {
        x: sx, y: 2.42, w: sw, h: 0.35,
        fontSize: 14, fontFace: B_FONT, color: C.MUTED, align: "center", margin: 0,
      });
    });

    // Description rows
    const descs = [
      { t: "Semantic Hints", d: "Each field has description and keywords \u2014 both guide Claude's understanding of what to extract and where to look" },
      { t: "Drives Everything", d: "Skills read the schema to know what to extract; validation checks outputs against it; the merge tool structures Excel columns from it" },
      { t: "Zero-Code Extension", d: "Adding a new extraction target = adding one JSON entry to the schema. No code changes anywhere in the pipeline." },
    ];
    descs.forEach((item, i) => {
      const dy = 3.2 + i * 0.72;
      s.addShape(pres.shapes.OVAL, { x: 0.7, y: dy + 0.05, w: 0.35, h: 0.35, fill: { color: C.ACCENT_LIGHT } });
      s.addImage({ data: ic.key, x: 0.78, y: dy + 0.1, w: 0.2, h: 0.2 });
      s.addText(item.t, {
        x: 1.25, y: dy, w: 3, h: 0.28,
        fontSize: 13, fontFace: B_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
      });
      s.addText(item.d, {
        x: 1.25, y: dy + 0.28, w: 7.8, h: 0.35,
        fontSize: 11, fontFace: B_FONT, color: C.MUTED, align: "left", margin: 0,
      });
    });
  }

  // ============================================================
  // SLIDE 7 — Two-Stage Extraction
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Two-Stage Extraction", "Vision \u2192 Reasoning: Separation of Concerns at the AI Level");

    const sw = 3.8, sg = 0.6;

    // Stage 1 card
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.7, w: sw, h: 2.6, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.7, w: sw, h: 0.06, fill: { color: C.ACCENT } });
    s.addShape(pres.shapes.OVAL, { x: 1.0, y: 1.9, w: 0.5, h: 0.5, fill: { color: C.ACCENT_LIGHT } });
    s.addImage({ data: ic.eye, x: 1.08, y: 1.98, w: 0.34, h: 0.34 });
    s.addText("Stage 1 \u2014 Vision", {
      x: 1.7, y: 1.95, w: 2.5, h: 0.35,
      fontSize: 16, fontFace: H_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
    });
    s.addText("Layout Understanding", {
      x: 1.7, y: 2.3, w: 2.5, h: 0.25,
      fontSize: 11, fontFace: B_FONT, color: C.ACCENT, align: "left", margin: 0,
    });
    s.addText([
      { text: "PDF pages \u2192 PNG rendering", options: { bullet: true, breakLine: true } },
      { text: "Vision API extracts structured text", options: { bullet: true, breakLine: true } },
      { text: "Preserves document layout & tables", options: { bullet: true, breakLine: true } },
      { text: "Output: _raw.txt per report", options: { bullet: true } },
    ], {
      x: 1.0, y: 2.65, w: 3.2, h: 1.5,
      fontSize: 11, fontFace: B_FONT, color: C.TEXT, margin: 0, paraSpaceAfter: 4,
    });

    // Arrow
    s.addImage({ data: ic.arrow, x: 0.7 + sw + 0.15, y: 2.85, w: 0.3, h: 0.3 });

    // Stage 2 card
    const s2x = 0.7 + sw + sg;
    s.addShape(pres.shapes.RECTANGLE, { x: s2x, y: 1.7, w: sw, h: 2.6, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: s2x, y: 1.7, w: sw, h: 0.06, fill: { color: C.ACCENT_DARK } });
    s.addShape(pres.shapes.OVAL, { x: s2x + 0.3, y: 1.9, w: 0.5, h: 0.5, fill: { color: C.ACCENT_LIGHT } });
    s.addImage({ data: ic.brainT, x: s2x + 0.38, y: 1.98, w: 0.34, h: 0.34 });
    s.addText("Stage 2 \u2014 Reasoning", {
      x: s2x + 1.0, y: 1.95, w: 3.0, h: 0.35,
      fontSize: 16, fontFace: H_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
    });
    s.addText("Semantic Extraction (CC Native)", {
      x: s2x + 1.0, y: 2.3, w: 3.0, h: 0.25,
      fontSize: 11, fontFace: B_FONT, color: C.ACCENT_DARK, align: "left", margin: 0,
    });
    s.addText([
      { text: "Claude Code reads raw text + schema", options: { bullet: true, breakLine: true } },
      { text: "Reasons semantically about each field", options: { bullet: true, breakLine: true } },
      { text: "CC native built-in capabilities", options: { bullet: true, breakLine: true } },
      { text: "Output: _unified_output.json", options: { bullet: true } },
    ], {
      x: s2x + 0.3, y: 2.65, w: 3.2, h: 1.5,
      fontSize: 11, fontFace: B_FONT, color: C.TEXT, margin: 0, paraSpaceAfter: 4,
    });

    // Benefits at bottom — two separate rows
    s.addText([
      { text: "Independent debugging: ", options: { bold: true, color: C.TEXT } },
      { text: "Is it a Vision problem or a Reasoning problem?", options: { color: C.MUTED } },
    ], {
      x: 0.7, y: 4.5, w: 8.6, h: 0.35,
      fontSize: 11, fontFace: B_FONT, align: "left", margin: 0,
    });
    s.addText([
      { text: "Semantic fallback: ", options: { bold: true, color: C.TEXT } },
      { text: "When matching fails, the skill reads the first page and classifies relevance", options: { color: C.MUTED } },
    ], {
      x: 0.7, y: 4.85, w: 8.6, h: 0.35,
      fontSize: 11, fontFace: B_FONT, align: "left", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 8 — Manifest-Driven Orchestration
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Manifest-Driven Orchestration", "JSON Manifests as Pipeline Contracts");

    // Flow boxes
    const flow = [
      { label: "vision_manifest\n.json", accent: C.ACCENT },
      { label: "_raw.txt\nfiles", accent: C.TEAL },
      { label: "reason_manifest\n.json", accent: C.ACCENT_DARK },
      { label: "_unified_output\n.json", accent: C.NAVY },
    ];
    const fw = 1.8, fg = 0.5, fsx = 0.7;
    flow.forEach((f, i) => {
      const fx = fsx + i * (fw + fg);
      s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 1.7, w: fw, h: 1.0, fill: { color: C.CARD }, shadow: mkShadow() });
      s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 1.7, w: fw, h: 0.06, fill: { color: f.accent } });
      s.addText(f.label, {
        x: fx, y: 1.85, w: fw, h: 0.7,
        fontSize: 11, fontFace: "Consolas", color: C.TEXT, align: "center", valign: "middle", margin: 0,
      });
      if (i < flow.length - 1) {
        s.addImage({ data: ic.arrow, x: fx + fw + 0.12, y: 2.05, w: 0.22, h: 0.22 });
      }
    });

    // Benefits
    const benefits = [
      "Steps independently testable, pausable, and resumable",
      "Easy to inspect intermediate state \u2014 fully transparent, no black box",
      "New steps insertable without changing existing ones",
    ];
    benefits.forEach((b, i) => {
      const by = 3.2 + i * 0.55;
      s.addImage({ data: ic.check, x: 0.7, y: by + 0.05, w: 0.2, h: 0.2 });
      s.addText(b, {
        x: 1.05, y: by, w: 8, h: 0.35,
        fontSize: 13, fontFace: B_FONT, color: C.TEXT, align: "left", margin: 0,
      });
    });
  }

  // ============================================================
  // SLIDE 9 — Output & Validation
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.LIGHT_BG };
    addTitle(s, "Output & Validation", "Structured Deliverables with Built-In Quality Checks");

    // Left column: Deliverables
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.6, w: 4.1, h: 3.4, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.6, w: 4.1, h: 0.06, fill: { color: C.ACCENT_DARK } });
    s.addText("Deliverables", {
      x: 1.0, y: 1.8, w: 3.5, h: 0.35,
      fontSize: 16, fontFace: H_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
    });
    const outputs = [
      { b: "Per-document:", t: " _unified_output.json with all 101 schema fields across 4 domains" },
      { b: "Per-vehicle:", t: " merged_final_result.json as a merged array of all reports" },
      { b: "Excel workbook:", t: " 4 sheets \u2014 General, Battery, Motor, E-Control" },
      { b: "Styled output:", t: " Frozen headers, auto-width columns, source traceability" },
    ];
    outputs.forEach((o, i) => {
      s.addText([
        { text: o.b, options: { bold: true, color: C.TEXT } },
        { text: o.t, options: { color: C.MUTED } },
      ], {
        x: 1.0, y: 2.35 + i * 0.6, w: 3.5, h: 0.5,
        fontSize: 11, fontFace: B_FONT, align: "left", margin: 0,
      });
    });

    // Right column: Validation
    s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.1, h: 3.4, fill: { color: C.CARD }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.1, h: 0.06, fill: { color: C.GREEN } });
    s.addText("Agent Validation", {
      x: 5.5, y: 1.8, w: 3.5, h: 0.35,
      fontSize: 16, fontFace: H_FONT, color: C.TEXT, bold: true, align: "left", margin: 0,
    });
    const vals = [
      "Verifies all 101 keys present after each extraction",
      "Removes any hallucinated extra keys automatically",
      "Ensures consistent data types across all fields",
      "Normalizes date formats and multi-value separators",
    ];
    vals.forEach((v, i) => {
      const vy = 2.35 + i * 0.6;
      s.addImage({ data: ic.check, x: 5.5, y: vy + 0.05, w: 0.18, h: 0.18 });
      s.addText(v, {
        x: 5.85, y: vy, w: 3.2, h: 0.5,
        fontSize: 11, fontFace: B_FONT, color: C.TEXT, align: "left", margin: 0,
      });
    });
  }

  // ============================================================
  // SLIDE 10 — Summary
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.DARK_BG };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.ACCENT } });

    s.addText("Key Takeaways", {
      x: 0.8, y: 0.5, w: 8.4, h: 0.7,
      fontSize: 32, fontFace: H_FONT, color: C.WHITE, bold: true, align: "left", margin: 0,
    });

    const takeaways = [
      "Built entirely on Claude Code Skills \u2014 atomic, batch, and chain skills compose into full pipelines",
      "Handles ad-hoc structured inputs: semantic understanding replaces brittle deterministic workflows",
      "Schema-as-specification: one JSON file drives extraction, validation, and output structure",
      "Two-stage AI extraction: Vision for layout understanding, Claude Code reasoning for semantics",
      "Manifest-driven orchestration: transparent, resumable, composable pipeline",
      "16 composable skills defined in natural language, not code",
    ];
    takeaways.forEach((t, i) => {
      const ty = 1.5 + i * 0.6;
      s.addImage({ data: ic.checkW, x: 0.8, y: ty + 0.03, w: 0.22, h: 0.22 });
      s.addText(t, {
        x: 1.2, y: ty, w: 7.8, h: 0.5,
        fontSize: 13, fontFace: B_FONT, color: "CBD5E1", align: "left", margin: 0,
      });
    });
  }

  // Write file
  await pres.writeFile({ fileName: "/home/laliyepp/dev/battery-vision-agent/battery_vision_agent_architecture.pptx" });
  console.log("Created: battery_vision_agent_architecture.pptx");
}

main().catch(console.error);
