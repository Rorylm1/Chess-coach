/**
 * Server-only: invent a fresh TableSpec by asking Claude to art-direct a complete visual
 * world, then run the legibility backstop. Sealed behind this module so the rest of the app
 * never imports the Anthropic SDK. A high-entropy combinatorial brief (per
 * research/randomize-prompt-research.md) beats "default image collapse" so every roll is a
 * genuinely different world; a deterministic fallback covers a missing key / API error.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { backstop } from "./backstop";
import type { TableSpec } from "./spec";

/** One-line swap point (drop to "claude-sonnet-4-6" if latency/cost bites). */
export const TABLE_MODEL = "claude-opus-4-8";

export function isTableConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

// ---- high-entropy brief engine ----
const ERAS = ["pre-war ocean liner","Soviet space program","Kyoto tea house","Weimar cabaret","Edo woodblock studio","1970s jazz record sleeve","alpine cartographer's hut","Victorian botanical press","monastic scriptorium","vintage racing pit","arctic research station","apothecary cabinet","Bauhaus print shop","Art Nouveau métro","mid-century planetarium","colonial spice warehouse","brutalist parking structure","deep-sea submersible","desert observatory","tropical modernist villa","Byzantine mosaic workshop","retro-futurist airline lounge","silk-road caravanserai","Memphis design showroom","film-noir detective office","gothic stained-glass nave","analog synth laboratory","Persian miniature atelier","19th-century print foundry"];
const LIGHTS = ["candlelit","phosphor glow","overcast northern","golden-hour","moonlit","sodium-vapor street","firelit","dawn-grey","ultraviolet blacklight","fluorescent basement","stained-glass dappled","bioluminescent","tungsten warm","stormlight","neon-sign spill"];
const MATERIALS = ["oxidized brass","abalone shell","raw board-marked concrete","washi paper","smoked glass","terrazzo","lacquered rosewood","hammered pewter","bottle-green bakelite","verdigris copper","bone china","cracked vellum","anodized aluminium","tobacco-stained ivory","cobalt enamel","burnished gold leaf","weathered teak","frosted acrylic","oxblood leather","slate and chalk"];
const MOVEMENTS = ["asemic mark-making","biomorphic curves","risograph misregistration","Suprematist geometry","Art Deco rhythm","Memphis clash","Swiss International grid","Sovietwave","liminal-space stillness","overgrown brutalism","Ukiyo-e flatness","Constructivist diagonals","calligraphic gesture","halftone screenprint","De Stijl primaries","psychedelic optical","minimalist negative space","maximalist ornament","glitch chromatic-aberration","woodcut relief"];
const FEELS = ["austere and precise","warm and generous","playful and electric","hushed and scholarly","opulent and theatrical","crisp and clinical","romantic and faded","bold and graphic","melancholy and quiet","jubilant and saturated","severe and monumental","intimate and handmade"];
const VALUE_KEYS = ["paper-bright: a LIGHT background (near-white/cream/pale), dark ink — like a printed page","mid-toned: muted mid-value ground, neither dark nor bright","dark and atmospheric","warm cream and ink, editorial and light","high-key and saturated: bright, confident color fields"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const SCHEMA = {
  type: "object",
  required: ["name","flavor","fontDisplay","fontBody","fontMono","displayWeight","displaySpacing","displayTransform",
    "corner","frame","motion","radius","bg","bgGradient","panel","panel2","surface","hairline","hairline2",
    "ink","inkSoft","inkFaint","accentInteractive","accentInteractiveDim","accentEval","accentEvalDim",
    "boardLight","boardDark","pieceWhite","pieceWhiteRim","pieceBlack","pieceBlackRim","boardAccent","boardLast","coordOnLight","coordOnDark","pieceStyle"],
  properties: {
    name: { type: "string", description: "evocative 1-3 word name for this table's world" },
    flavor: { type: "string", description: "one short poetic sentence; you may wrap up to 2 words in <em></em>" },
    fontDisplay: { type: "string", description: "any real Google Fonts family for headings — NOT Inter/Roboto/Arial/system-ui/Space Grotesk" },
    fontBody: { type: "string", description: "any real Google Fonts family for body/coach voice" },
    fontMono: { type: "string", description: "any real Google Fonts monospaced (or tabular) family for notation/eval/coords" },
    displayWeight: { type: "integer", description: "display weight 400-900" },
    displaySpacing: { type: "string", description: "display letter-spacing em value, e.g. '0.04em' or '-0.01em'" },
    displayTransform: { type: "string", enum: ["none", "uppercase"] },
    corner: { type: "string", enum: ["bracket", "deco", "round", "square", "notch"] },
    frame: { type: "string", enum: ["glow", "deco", "rule", "shadow", "rotate", "plain"] },
    motion: { type: "string", enum: ["boot", "rise", "draw"] },
    radius: { type: "integer", description: "base corner radius in px, 0-16" },
    bg: { type: "string", description: "page background base color, hex" },
    bgGradient: { type: "string", description: "a full CSS background-image value (layered gradients) for atmosphere — your own composition" },
    panel: { type: "string" }, panel2: { type: "string" }, surface: { type: "string" },
    hairline: { type: "string", description: "border color, hex or rgba()" }, hairline2: { type: "string", description: "subtler border, hex or rgba()" },
    ink: { type: "string", description: "primary text color, hex" }, inkSoft: { type: "string" }, inkFaint: { type: "string" },
    accentInteractive: { type: "string", description: "INTERACTIVE accent (selection, hints, CTA, focus) hex" },
    accentInteractiveDim: { type: "string" },
    accentEval: { type: "string", description: "EVALUATION accent (eval, last move, the 'you' player) hex — distinct from the interactive accent" },
    accentEvalDim: { type: "string" },
    boardLight: { type: "string" }, boardDark: { type: "string" },
    pieceWhite: { type: "string" }, pieceWhiteRim: { type: "string", description: "white piece outline hex (opposite lightness)" },
    pieceBlack: { type: "string" }, pieceBlackRim: { type: "string", description: "black piece outline hex (opposite lightness)" },
    boardAccent: { type: "string", description: "on-board cue color (selection, hints) hex" },
    boardLast: { type: "string", description: "last-move highlight hex" },
    coordOnLight: { type: "string" }, coordOnDark: { type: "string" },
    pieceStyle: { type: "string", enum: ["classic-staunton","minimalist-line","flat-silhouette","fantasy-illustrative","geometric-spatial","woodcut-celtic","letter-mark","neon-outline","calligraphic"] },
  },
} as const;

const SYSTEM =
  "You are an award-winning art director designing the UI for a warm, editorial chess-study app's live game screen. " +
  "Your job: INVENT A COMPLETELY FRESH, COHERENT VISUAL WORLD — a new one every single time, never repeating yourself, never generic. " +
  "Reject your first instinct: it is almost certainly a cliché. Commit hard and specifically to one unexpected aesthetic. " +
  "Actively avoid the AI-default 'dark dashboard with a single bright accent' — vary your value key, temperature, and accent logic. " +
  "Hard rules: (1) NEVER use Inter, Roboto, Arial, system-ui, or Space Grotesk; pick characterful real Google Fonts that fit the world. " +
  "(2) No purple-on-white 'AI hero' gradients, no glassmorphism. " +
  "(3) The two accents carry MEANING and must stay visually distinct: accentInteractive = the player's actions; accentEval = the engine's voice. " +
  "(4) The chess board is the hero: light vs dark squares clearly distinct, and each piece has a fill + an opposite-lightness rim so it reads on both square tones. " +
  "(5) Pick a genuinely original palette grounded in the brief's materials/light — do NOT default to teal/cyan/amber. " +
  "(6) Choose the pieceStyle whose silhouette fits the world. Return ONLY the tool call.";

/** Invent one fresh table via Claude (throws on API error — caller falls back). */
export async function generateTable(): Promise<TableSpec> {
  const brief =
    `${pick(LIGHTS)} ${pick(ERAS)} rendered in ${pick(MATERIALS)}, with a hint of ${pick(MOVEMENTS)}; ` +
    `feeling ${pick(FEELS)} — but unexpectedly crossed with a ${pick(ERAS)} sensibility.`;
  const valueKey = pick(VALUE_KEYS);
  const user =
    `Design tonight's table. Loose inspiration (do NOT be literal — resolve the clash into one coherent world): "${brief}". ` +
    `VALUE KEY (obey this — it sets the overall lightness): ${valueKey}. ` +
    `Invent a name, a one-line flavor, an original palette grounded in those materials and that light, a characterful font trio, a coherent shape/frame/motion language, and the piece-set style that belongs in this world. Make it unmistakably its own world, unlike any default.`;

  const msg = await getClient().messages.create({
    model: TABLE_MODEL,
    max_tokens: 1600,
    temperature: 1,
    system: SYSTEM,
    tools: [{ name: "present_table", description: "Present the invented table design.", input_schema: SCHEMA as unknown as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: "present_table" },
    messages: [{ role: "user", content: user }],
  });
  const block = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!block) throw new Error("no tool_use in table response");
  const input = block.input as Record<string, unknown>;
  const spec = { id: "gen-" + Date.now().toString(36), brief, ...input } as TableSpec;
  return backstop(spec);
}

/**
 * Deterministic offline fallbacks (no LLM) — used when the key is missing or the API errors,
 * so "Deal a table" always yields a fresh look. Three distinct worlds; picked at random.
 */
const FALLBACKS: TableSpec[] = [
  {
    id: "fb-salon", name: "The Grand Salon", flavor: "Emerald baize and gilt — a card room by <em>candlelight</em>.",
    fontDisplay: "Marcellus", fontBody: "EB Garamond", fontMono: "Marcellus",
    displayWeight: 400, displaySpacing: "0.05em", displayTransform: "none",
    corner: "deco", frame: "rule", motion: "rise", radius: 2,
    bg: "#0c2620", bgGradient: "radial-gradient(120% 80% at 50% -10%, #16433a 0%, #0c2620 60%, #081c17 100%)",
    panel: "#103229", panel2: "#0b211c", surface: "#16433a", hairline: "rgba(201,162,74,0.34)", hairline2: "rgba(201,162,74,0.22)",
    ink: "#f3ebd9", inkSoft: "#cabfa6", inkFaint: "#a07d2e",
    accentInteractive: "#d9b35e", accentInteractiveDim: "#a07d2e", accentEval: "#9ec7a8", accentEvalDim: "#6f9a82",
    boardLight: "#f3ebd9", boardDark: "#1d564a", pieceWhite: "#fbf6ea", pieceWhiteRim: "#0c1f1a", pieceBlack: "#0c1f1a", pieceBlackRim: "#e7d7ac",
    boardAccent: "#d9b35e", boardLast: "#9ec7a8", coordOnLight: "#0c2a22", coordOnDark: "#e7d7ac", pieceStyle: "classic-staunton",
  },
  {
    id: "fb-editorial", name: "Warm Editorial Study", flavor: "Ink on warm paper — <em>a study</em>, not a scoreboard.",
    fontDisplay: "Fraunces", fontBody: "Hanken Grotesk", fontMono: "IBM Plex Mono",
    displayWeight: 600, displaySpacing: "0", displayTransform: "none",
    corner: "round", frame: "rotate", motion: "rise", radius: 8,
    bg: "#f6efe2", bgGradient: "radial-gradient(900px 600px at 88% -6%, rgba(181,83,42,0.08), transparent 60%), radial-gradient(800px 600px at 2% 108%, rgba(47,93,84,0.07), transparent 60%)",
    panel: "#fdf8ee", panel2: "#f3e9d6", surface: "#efe3cd", hairline: "rgba(33,28,22,0.18)", hairline2: "rgba(33,28,22,0.12)",
    ink: "#211c16", inkSoft: "#5b5446", inkFaint: "#8a8064",
    accentInteractive: "#b5532a", accentInteractiveDim: "#8c3f1f", accentEval: "#2f5d54", accentEvalDim: "#244a43",
    boardLight: "#e7d6b6", boardDark: "#a9763f", pieceWhite: "#fcf8ef", pieceWhiteRim: "#2a1f12", pieceBlack: "#2a1f12", pieceBlackRim: "#f3e6cc",
    boardAccent: "#b5532a", boardLast: "#2f5d54", coordOnLight: "#5a4326", coordOnDark: "#f0e2c4", pieceStyle: "minimalist-line",
  },
  {
    id: "fb-afterhours", name: "After Hours", flavor: "Neon over felt — plum dark, hot coral, a <em>lime tick</em>.",
    fontDisplay: "Chakra Petch", fontBody: "Sora", fontMono: "Space Mono",
    displayWeight: 700, displaySpacing: "0.04em", displayTransform: "uppercase",
    corner: "notch", frame: "glow", motion: "boot", radius: 0,
    bg: "#160d1a", bgGradient: "radial-gradient(110% 90% at 84% -8%, rgba(255,107,138,0.14), transparent 52%), radial-gradient(120% 100% at 6% 108%, rgba(198,242,78,0.08), transparent 52%), radial-gradient(150% 130% at 50% 50%, #1d1322, #0f0813 92%)",
    panel: "#1d1322", panel2: "#160d1a", surface: "#271a2e", hairline: "rgba(255,107,138,0.22)", hairline2: "rgba(243,233,242,0.12)",
    ink: "#f3e9f2", inkSoft: "#c0aec3", inkFaint: "#8a7790",
    accentInteractive: "#ff6b8a", accentInteractiveDim: "#c14d68", accentEval: "#c6f24e", accentEvalDim: "#94b93a",
    boardLight: "#d9c8e2", boardDark: "#4a2f5c", pieceWhite: "#fbf3fa", pieceWhiteRim: "#1a0f20", pieceBlack: "#1a0f20", pieceBlackRim: "#e7b8d0",
    boardAccent: "#ff6b8a", boardLast: "#c6f24e", coordOnLight: "#3a2147", coordOnDark: "#e0cfe8", pieceStyle: "geometric-spatial",
  },
];

export function fallbackTable(): TableSpec {
  return backstop({ ...pick(FALLBACKS), id: "fb-" + Date.now().toString(36) });
}
