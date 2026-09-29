/** Shared validation for AI output and untrusted multiplayer board designs. */
import { PIECE_STYLES, type TableSpec } from "./spec";

export const TABLE_SCHEMA = {
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
    pieceStyle: { type: "string", enum: PIECE_STYLES },
  },
} as const;

/** Reject malformed model output before rendering it or running color arithmetic. */
export function parseTable(value: unknown): TableSpec {
  if (!value || typeof value !== "object") throw new Error("invalid table output");
  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of TABLE_SCHEMA.required) {
    const definition = TABLE_SCHEMA.properties[key];
    const field = input[key];
    if (definition.type === "integer") {
      if (typeof field !== "number" || !Number.isFinite(field)) throw new Error(`invalid ${key}`);
      result[key] = Math.round(Math.max(key === "radius" ? 0 : 400, Math.min(key === "radius" ? 16 : 900, field)));
    } else {
      if (typeof field !== "string" || field.length > (key === "bgGradient" ? 1600 : 400)) throw new Error(`invalid ${key}`);
      if ("enum" in definition && !(definition.enum as readonly string[]).includes(field)) throw new Error(`invalid ${key}`);
      result[key] = field;
    }
  }
  for (const key of ["bg", "panel", "panel2", "surface", "ink", "inkSoft", "inkFaint", "accentInteractive", "accentInteractiveDim", "accentEval", "accentEvalDim", "boardLight", "boardDark", "pieceWhite", "pieceWhiteRim", "pieceBlack", "pieceBlackRim", "boardAccent", "boardLast", "coordOnLight", "coordOnDark"]) {
    if (!/^#[0-9a-f]{6}$/i.test(input[key] as string)) throw new Error(`invalid color ${key}`);
  }
  for (const key of ["fontDisplay", "fontBody", "fontMono"]) {
    if (!/^[a-z0-9][a-z0-9 -]{0,63}$/i.test(input[key] as string)) throw new Error(`invalid font ${key}`);
  }
  if (!/^-?(?:0|[0-9]*\.[0-9]+)(?:em)?$/.test(input.displaySpacing as string)) result.displaySpacing = "0.02em";
  const gradient = input.bgGradient as string;
  // Only gradient/color functions; no external assets, variables, or CSS statements.
  const functions = gradient.match(/[a-z-]+(?=\()/gi) ?? [];
  if (gradient !== "none" && (!functions.length || /[;{}<>\\]/.test(gradient) || functions.some((f) => !/^(?:(?:repeating-)?(?:linear|radial|conic)-gradient|rgba?|hsla?|oklch|oklab)$/.test(f)))) throw new Error("invalid background");
  for (const key of ["hairline", "hairline2"]) {
    if (!/^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\))$/i.test(input[key] as string)) throw new Error(`invalid ${key}`);
  }
  return { ...result,
    id: typeof input.id === "string" ? input.id.slice(0, 100) : "shared-table",
    brief: typeof input.brief === "string" ? input.brief.slice(0, 400) : undefined,
  } as unknown as TableSpec;
}
