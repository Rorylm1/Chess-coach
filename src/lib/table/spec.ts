/**
 * The "generative table" spec (M7-adjacent, Play-tab only).
 *
 * A TableSpec is the validated design Claude invents for one game: a complete, coherent
 * visual world (surfaces, accents, type, shape/motion, board palette, piece style). The
 * spec is RENDERED by us — never injected as raw CSS — and mapped onto the app's existing
 * `:root` tokens so the whole Play screen reskins with zero CSS rewrites. A deterministic
 * legibility backstop (see `backstop.ts`) runs server-side so the board can never come back
 * illegible. Ephemeral by design: a dealt table is not persisted; the classic Deep-Space
 * look is always the default.
 *
 * This module is framework-agnostic and safe on client and server (no Anthropic import).
 */

import type { PieceSetName } from "./pieceSets";

export const PIECE_STYLES = [
  "classic-staunton", "minimalist-line", "flat-silhouette", "fantasy-illustrative",
  "geometric-spatial", "woodcut-celtic", "letter-mark", "neon-outline", "calligraphic",
  "orbital", "botanical", "origami", "pixel",
  "clockwork", "tidal", "maurimo-fantasy", "kiwen-suwi", "rhosgfx",
] as const;
export type PieceStyle = (typeof PIECE_STYLES)[number];
export type CornerStyle = "bracket" | "deco" | "round" | "square" | "notch";
export type FrameStyle = "glow" | "deco" | "rule" | "shadow" | "rotate" | "plain";
export type MotionStyle = "boot" | "rise" | "draw";

export interface TableSpec {
  id: string;
  name: string;
  flavor: string;            // one line; may contain <em>…</em>
  brief?: string;            // the entropy brief that seeded it (for the kicker)
  // typography (any real Google Fonts family; loaded on the fly)
  fontDisplay: string; fontBody: string; fontMono: string;
  displayWeight: number; displaySpacing: string; displayTransform: "none" | "uppercase";
  // shape + motion
  corner: CornerStyle; frame: FrameStyle; motion: MotionStyle; radius: number;
  // surfaces
  bg: string; bgGradient: string; panel: string; panel2: string; surface: string;
  hairline: string; hairline2: string;
  ink: string; inkSoft: string; inkFaint: string;
  // accents (meaning-bearing: interactive = your actions, eval = engine voice)
  accentInteractive: string; accentInteractiveDim: string;
  accentEval: string; accentEvalDim: string;
  // board + pieces
  boardLight: string; boardDark: string;
  pieceWhite: string; pieceWhiteRim: string; pieceBlack: string; pieceBlackRim: string;
  boardAccent: string; boardLast: string; coordOnLight: string; coordOnDark: string;
  pieceStyle: PieceStyle;
}

/** hex (#rgb/#rrggbb) → rgba() string. */
export function hexA(hex: string, a: number): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = "808080";
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Pick readable text for controls filled with an arbitrary generated accent. */
function inkOnAccent(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

/**
 * Map a spec onto the app's existing CSS custom properties (globals.css `:root`). Set the
 * result on the Play `.game` wrapper and the whole screen reskins — the cyan/amber accent
 * *roles* are preserved (interactive vs eval), just recolored.
 */
export function specToVars(s: TableSpec): Record<string, string> {
  return {
    "--void": s.bg,
    "--bg": s.bg,
    "--panel": s.panel,
    "--panel-2": s.panel2,
    "--surface": s.surface,
    "--slate": s.surface,
    "--cyan": s.accentInteractive,
    "--cyan-dim": s.accentInteractiveDim,
    "--on-interactive": inkOnAccent(s.accentInteractive),
    "--cyan-glow": hexA(s.accentInteractive, 0.45),
    "--amber": s.accentEval,
    "--amber-dim": s.accentEvalDim,
    "--ink": s.ink,
    "--ink-soft": s.inkSoft,
    "--ink-faint": s.inkFaint,
    "--hairline": s.hairline,
    "--hairline-2": s.hairline2,
    "--sq-light": s.boardLight,
    "--sq-dark": s.boardDark,
    "--piece-white": s.pieceWhite,
    "--piece-white-rim": s.pieceWhiteRim,
    "--piece-black": s.pieceBlack,
    "--piece-black-rim": s.pieceBlackRim,
    "--board-accent": s.boardAccent,
    "--board-accent-fill": hexA(s.boardAccent, 0.18),
    "--board-accent-glow": hexA(s.boardAccent, 0.45),
    "--board-last": s.boardLast,
    "--board-last-fill": hexA(s.boardLast, 0.24),
    "--board-frame": s.boardAccent,
    "--coord-on-light": s.coordOnLight,
    "--coord-on-dark": s.coordOnDark,
    "--font-display": `"${s.fontDisplay}", Georgia, serif`,
    "--font-body": `"${s.fontBody}", system-ui, sans-serif`,
    "--font-mono": `"${s.fontMono}", ui-monospace, monospace`,
    "--table-radius": `${s.radius}px`,
    "--table-display-weight": String(s.displayWeight),
    "--table-display-spacing": s.displaySpacing,
    "--table-display-transform": s.displayTransform,
  };
}

/** Variant flags CSS keys off (corner/frame/motion + the piece set + treatment). */
export function specToAttrs(s: TableSpec): Record<string, string> {
  const p = pieceRender(s.pieceStyle);
  return {
    "data-corner": s.corner,
    "data-frame": s.frame,
    "data-motion": s.motion,
    "data-pieceset": p.set,
    "data-pieces": p.treat,
  };
}

/** The three Google Fonts families to load for a spec. */
export function fontsOf(s: TableSpec): string[] {
  return [s.fontDisplay, s.fontBody, s.fontMono].filter(Boolean);
}

/**
 * Map a piece style to an actual silhouette family and a CSS treatment.
 * The family type comes from the asset registry so additions cannot silently drift.
 */
export function pieceRender(style: PieceStyle): { set: PieceSetName; treat: string } {
  switch (style) {
    case "orbital":
    case "botanical":
    case "origami":
    case "pixel":
    case "clockwork":
    case "tidal":
    case "maurimo-fantasy":
    case "kiwen-suwi":
    case "rhosgfx":
      return { set: style, treat: "filled" };
    case "letter-mark":
    case "calligraphic":
      return { set: "letter", treat: "letter" };
    case "classic-staunton":
      return { set: "cburnett", treat: "filled" };
    case "fantasy-illustrative":
      return { set: "maurimo-fantasy", treat: "filled" };
    case "woodcut-celtic":
      return { set: "cburnett", treat: "bold" };
    case "flat-silhouette":
    case "minimalist-line":
      return { set: "chessnut", treat: "flat" };
    case "geometric-spatial":
      return { set: "chessnut", treat: "bold" };
    case "neon-outline":
      return { set: "chessnut", treat: "neon" };
    default:
      return { set: "chessnut", treat: "filled" };
  }
}
