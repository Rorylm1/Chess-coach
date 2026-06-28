/* ============================================================
   GENERATIVE TABLE — live exploration server (throwaway).
   Serves generative-table.html and exposes POST /api/generate-table,
   which asks Claude to INVENT a brand-new chess UI design from scratch
   on every call. A deterministic legibility backstop then guarantees the
   freshly-invented board is always readable (the LLM never breaks the hero).

   Run:  node research/designs/table-server.mjs   (from repo root)
   Open: http://localhost:8788/
   ============================================================ */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// ---- load ANTHROPIC_API_KEY from .env.local ----
function loadKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    const m = env.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return null;
}
const API_KEY = loadKey();
const client = new Anthropic({ apiKey: API_KEY });
const MODEL = "claude-opus-4-8";

// ============================================================
// COLOR MATH (sRGB WCAG) + legibility backstop — no LLM, pure code
// ============================================================
function hexToRgb(h) {
  h = String(h).replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = "808080";
  const n = parseInt(h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
const toHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("");
function relLum({ r, g, b }) {
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, z) {
  const x = relLum(a), y = relLum(z), hi = Math.max(x, y), lo = Math.min(x, y);
  return (hi + 0.05) / (lo + 0.05);
}
function legSq(fill, rim, sq) {
  return Math.max(contrast(hexToRgb(fill), hexToRgb(sq)), contrast(hexToRgb(rim), hexToRgb(sq)));
}
// nudge a hex toward black or white in small steps
function pushL(hex, dir, step = 0.06) {
  const c = hexToRgb(hex);
  const t = dir > 0 ? 1 : 0;
  return toHex({ r: c.r + (t - c.r) * step * 3, g: c.g + (t - c.g) * step * 3, b: c.b + (t - c.b) * step * 3 });
}

/** The guarantee: board is legible by construction, whatever the LLM dreamed up. */
function backstopBoard(b) {
  const out = { ...b };
  // 1. square contrast: light vs dark must read as two distinct tones
  let guard = 0;
  while (contrast(hexToRgb(out.light), hexToRgb(out.dark)) < 1.7 && guard++ < 24) {
    if (relLum(hexToRgb(out.light)) >= relLum(hexToRgb(out.dark))) {
      out.light = pushL(out.light, +1); out.dark = pushL(out.dark, -1);
    } else { out.light = pushL(out.light, -1); out.dark = pushL(out.dark, +1); }
  }
  // 2. two-tone pieces: whichever tone (fill OR rim) contrasts a square carries legibility.
  //    Drive the RIM to the opposite L-extreme of the fill until both squares pass >= 3:1.
  const fix = (fill, rim, fillDir) => {
    let f = fill, r = rim, g = 0;
    while ((legSq(f, r, out.light) < 3 || legSq(f, r, out.dark) < 3) && g++ < 40) {
      r = pushL(r, fillDir > 0 ? -1 : +1);   // rim away from fill
      f = pushL(f, fillDir > 0 ? +1 : -1, 0.03);
    }
    return { f, r };
  };
  const w = fix(out.pw, out.pwRim, +1);  out.pw = w.f; out.pwRim = w.r;   // white: light fill, dark rim
  const k = fix(out.pb, out.pbRim, -1);  out.pb = k.f; out.pbRim = k.r;   // black: dark fill, light rim
  return out;
}
/** Body text must be readable on the surfaces. */
function backstopInk(w) {
  const out = { ...w };
  const bgLight = relLum(hexToRgb(out.bg)) > 0.4;
  let g = 0;
  while (contrast(hexToRgb(out.ink), hexToRgb(out.panel)) < 4.5 && g++ < 30) out.ink = pushL(out.ink, bgLight ? -1 : +1);
  if (contrast(hexToRgb(out.inkSoft), hexToRgb(out.panel)) < 2.8) out.inkSoft = pushL(out.inkSoft, bgLight ? -1 : +1);
  return out;
}

// ============================================================
// THE PROMPT — invent a fresh, coherent world every time
// ============================================================
const SCHEMA = {
  type: "object",
  required: ["name","flavor","fontDisplay","fontBody","fontMono","displayWeight","displaySpacing","displayTransform",
            "corner","frame","motion","radius","bg","bgGradient","panel","panel2","surface","hairline","hairline2",
            "ink","inkSoft","inkFaint","accentInteractive","accentInteractiveDim","accentEval","accentEvalDim",
            "boardLight","boardDark","pieceWhite","pieceWhiteRim","pieceBlack","pieceBlackRim","boardAccent","boardLast","coordOnLight","coordOnDark","pieceStyle"],
  properties: {
    name: { type: "string", description: "evocative 1-3 word name for this table's world" },
    flavor: { type: "string", description: "one short poetic sentence; you may wrap up to 2 words in <em></em>" },
    fontDisplay: { type: "string", description: "any real Google Fonts family for headings/wordmark — NOT Inter/Roboto/Arial/system-ui/Space Grotesk" },
    fontBody: { type: "string", description: "any real Google Fonts family for body/coach voice" },
    fontMono: { type: "string", description: "any real Google Fonts monospaced (or tabular serif) family for notation/eval/coords" },
    displayWeight: { type: "integer", description: "display weight 400-900" },
    displaySpacing: { type: "string", description: "display letter-spacing em value, e.g. '0.04em' or '-0.01em'" },
    displayTransform: { type: "string", enum: ["none", "uppercase"] },
    corner: { type: "string", enum: ["bracket", "deco", "round", "square", "notch"], description: "corner/shape language" },
    frame: { type: "string", enum: ["glow", "deco", "rule", "shadow", "rotate", "plain"], description: "how the board is framed" },
    motion: { type: "string", enum: ["boot", "rise", "draw"], description: "entrance signature" },
    radius: { type: "integer", description: "base corner radius in px, 0-16" },
    bg: { type: "string", description: "page background base color, hex" },
    bgGradient: { type: "string", description: "a full CSS background-image value (layered gradients) for atmosphere/depth — your own composition" },
    panel: { type: "string" }, panel2: { type: "string" }, surface: { type: "string" },
    hairline: { type: "string", description: "border color, hex or rgba()" }, hairline2: { type: "string", description: "subtler border, hex or rgba()" },
    ink: { type: "string", description: "primary text color, hex" }, inkSoft: { type: "string" }, inkFaint: { type: "string" },
    accentInteractive: { type: "string", description: "INTERACTIVE accent (selection, hints, CTA, focus, live) hex" },
    accentInteractiveDim: { type: "string" },
    accentEval: { type: "string", description: "EVALUATION accent (eval numbers, last-move, the 'you' player) hex — must read as distinct from the interactive accent" },
    accentEvalDim: { type: "string" },
    boardLight: { type: "string", description: "light square hex" }, boardDark: { type: "string", description: "dark square hex" },
    pieceWhite: { type: "string", description: "white piece fill hex" }, pieceWhiteRim: { type: "string", description: "white piece outline hex (opposite lightness)" },
    pieceBlack: { type: "string", description: "black piece fill hex" }, pieceBlackRim: { type: "string", description: "black piece outline hex (opposite lightness)" },
    boardAccent: { type: "string", description: "on-board cue color (selection ring, hint dots) hex" },
    boardLast: { type: "string", description: "last-move highlight hex" },
    coordOnLight: { type: "string", description: "coordinate label color on light squares hex" },
    coordOnDark: { type: "string", description: "coordinate label color on dark squares hex" },
    pieceStyle: { type: "string", enum: ["classic-staunton","minimalist-line","flat-silhouette","fantasy-illustrative","geometric-spatial","woodcut-celtic","letter-mark","neon-outline","calligraphic"], description: "which piece-set silhouette style fits this world" },
  },
};

// ---- HIGH-ENTROPY BRIEF ENGINE ----
// Per research/randomize-prompt-research.md: a tiny random brief collapses to
// "concept magnets" (AI-slop defaults). We fight that with combinatorial wildcards
// drawn from rare, low-density vocab across many axes, PLUS a deliberate cognitive-
// dissonance pairing (two clashing references) to force the model off its defaults.
const ERAS = ["pre-war ocean liner","Soviet space program","Kyoto tea house","Weimar cabaret","Edo woodblock studio","1970s jazz record sleeve","alpine cartographer's hut","Victorian botanical press","monastic scriptorium","vintage racing pit","arctic research station","apothecary cabinet","Bauhaus print shop","Art Nouveau métro","mid-century planetarium","colonial spice warehouse","brutalist parking structure","deep-sea submersible","desert observatory","tropical modernist villa","Byzantine mosaic workshop","retro-futurist airline lounge","silk-road caravanserai","Memphis design showroom","film-noir detective office","gothic stained-glass nave","analog synth laboratory","Bauhaus weaving studio","Persian miniature atelier","19th-century print foundry"];
const LIGHTS = ["candlelit","phosphor glow","overcast northern","golden-hour","moonlit","sodium-vapor street","firelit","dawn-grey","ultraviolet blacklight","fluorescent basement","stained-glass dappled","bioluminescent","tungsten warm","stormlight","neon-sign spill"];
const MATERIALS = ["oxidized brass","abalone shell","raw board-marked concrete","washi paper","smoked glass","terrazzo","lacquered rosewood","hammered pewter","bottle-green bakelite","verdigris copper","bone china","cracked vellum","anodized aluminium","tobacco-stained ivory","cobalt enamel","burnished gold leaf","weathered teak","frosted acrylic","oxblood leather","slate and chalk"];
const MOVEMENTS = ["asemic mark-making","biomorphic curves","risograph misregistration","Suprematist geometry","Art Deco rhythm","Memphis clash","Swiss International grid","Sovietwave","liminal-space stillness","overgrown brutalism","Ukiyo-e flatness","Constructivist diagonals","calligraphic gesture","halftone screenprint","De Stijl primaries","psychedelic optical","minimalist negative space","maximalist ornament","glitch chromatic-aberration","woodcut relief"];
const FEELS = ["austere and precise","warm and generous","playful and electric","hushed and scholarly","opulent and theatrical","crisp and clinical","romantic and faded","bold and graphic","melancholy and quiet","jubilant and saturated","severe and monumental","intimate and handmade"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// piece-set styles (enum inlined in SCHEMA) map to a permissively-licensed library
// (maurimo MIT, rhosgfx CC0, chessnut Apache, + authored). The model names the fitting set.

async function generateTable() {
  // combinatorial brief + one cognitive-dissonance clash (clashing references force novelty)
  const brief =
    `${pick(LIGHTS)} ${pick(ERAS)} rendered in ${pick(MATERIALS)}, with a hint of ${pick(MOVEMENTS)}; ` +
    `feeling ${pick(FEELS)} — but unexpectedly crossed with a ${pick(ERAS)} sensibility.`;
  // force value-key variety — the model's strongest default magnet is "dark dashboard"
  const VALUE_KEYS = ["paper-bright: a LIGHT background (near-white/cream/pale), dark ink — like a printed page",
    "mid-toned: muted mid-value ground, neither dark nor bright",
    "dark and atmospheric",
    "warm cream and ink, editorial and light",
    "high-key and saturated: bright, confident color fields"];
  const valueKey = pick(VALUE_KEYS);
  const system =
    "You are an award-winning art director designing the UI for a warm, editorial chess-study app's live game screen. " +
    "Your job: INVENT A COMPLETELY FRESH, COHERENT VISUAL WORLD — a new one every single time, never repeating yourself, never generic. " +
    "Reject your first instinct: it is almost certainly a cliché. Commit hard and specifically to one unexpected aesthetic. " +
    "Actively avoid the AI-default 'dark dashboard with a single bright accent' — vary your value key (some worlds are light, paper-bright, or mid-toned), your temperature, and your accent logic. " +
    "Hard rules: (1) NEVER use Inter, Roboto, Arial, system-ui, or Space Grotesk; pick characterful real Google Fonts that fit the world. " +
    "(2) No purple-on-white 'AI hero' gradients, no glassmorphism. " +
    "(3) The two accents carry MEANING and must stay visually distinct: accentInteractive = the player's actions (selection, hints, CTA, focus); accentEval = the engine's voice (eval, last move). " +
    "(4) The chess board is the hero: light vs dark squares clearly distinct, and each piece has a fill + an opposite-lightness rim so it reads on both square tones. " +
    "(5) Pick a genuinely original palette grounded in the brief's materials/light — do NOT default to teal/cyan/amber. " +
    "(6) Choose the pieceStyle whose silhouette fits the world. Return ONLY the tool call.";
  const user =
    `Design tonight's table. Loose inspiration (do NOT be literal — resolve the clash into one coherent world): "${brief}". ` +
    `VALUE KEY (obey this — it sets the overall lightness): ${valueKey}. ` +
    `Invent a name, a one-line flavor, an original palette grounded in those materials and that light, a characterful font trio, a coherent shape/frame/motion language, and the piece-set style that belongs in this world. Make it unmistakably its own world, unlike any default.`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1600,
    temperature: 1,
    system,
    tools: [{ name: "present_table", description: "Present the invented table design.", input_schema: SCHEMA }],
    tool_choice: { type: "tool", name: "present_table" },
    messages: [{ role: "user", content: user }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block) throw new Error("no tool_use in response");
  const s = block.input;

  // ---- map to the renderer's world shape, then run the legibility backstops ----
  let board = backstopBoard({
    light: s.boardLight, dark: s.boardDark, pw: s.pieceWhite, pwRim: s.pieceWhiteRim,
    pb: s.pieceBlack, pbRim: s.pieceBlackRim, accent: s.boardAccent, last: s.boardLast,
    coordLt: s.coordOnLight, coordDk: s.coordOnDark,
  });
  let world = backstopInk({
    id: "gen-" + Date.now().toString(36), chip: s.name, name: s.name, flavor: s.flavor,
    corner: s.corner, frame: s.frame, motion: s.motion,
    ff: { display: `"${s.fontDisplay}"`, body: `"${s.fontBody}"`, mono: `"${s.fontMono}"`,
          weight: s.displayWeight, spacing: s.displaySpacing, transform: s.displayTransform },
    fonts: { display: s.fontDisplay, body: s.fontBody, mono: s.fontMono },
    bg: s.bg, grad: s.bgGradient, panel: s.panel, panel2: s.panel2, surface: s.surface,
    hairline: s.hairline, hairline2: s.hairline2, ink: s.ink, inkSoft: s.inkSoft, inkFaint: s.inkFaint,
    ai: s.accentInteractive, aiDim: s.accentInteractiveDim, ae: s.accentEval, aeDim: s.accentEvalDim,
    radius: s.radius, board, pieceStyle: s.pieceStyle,
  });
  world.brief = brief;
  return world;
}

// ============================================================
// SERVER
// ============================================================
const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/generate-table") {
    try {
      const world = await generateTable();
      res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
      res.end(JSON.stringify(world));
    } catch (e) {
      console.error("generate error:", e?.message || e);
      res.writeHead(500, { "content-type": "application/json", "access-control-allow-origin": "*" });
      res.end(JSON.stringify({ error: String(e?.message || e) }));
    }
    return;
  }
  // static: serve the mockup
  const file = req.url === "/" || req.url === "" ? "generative-table.html" : req.url.replace(/^\//, "").split("?")[0];
  try {
    const body = readFileSync(join(__dirname, file));
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "text/javascript" : "text/plain";
    res.writeHead(200, { "content-type": type });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});

const PORT = 8788;
server.listen(PORT, () => {
  console.log(`\n  Generative Table  →  http://localhost:${PORT}/`);
  console.log(`  Claude key: ${API_KEY ? "loaded ✓" : "MISSING ✗ (set ANTHROPIC_API_KEY)"}  ·  model: ${MODEL}\n`);
});
