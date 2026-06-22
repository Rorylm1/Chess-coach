/**
 * The per-game randomized board palette (M6, Feature 1) — a *randomizer, not an editor*.
 *
 * Architecture (research/randomizer-color-system.md): "constrain first, vary second." We
 * fix the lightness scaffold as constants and let the seed pick only hue + a small chroma
 * jitter within each family's OKLCH clamps. Variety comes from *which* curated family a seed
 * lands in and *how much* it's perturbed — never from raw colour randomness. Two hard floors
 * are enforced after generation so every roll is legible by construction:
 *
 *   • piece legibility ≥ 3:1  — pieces are TWO-TONE (fill + opposite-luminance rim); on any
 *     square whichever tone contrasts carries it, so we require
 *     max(contrast(fill, sq), contrast(rim, sq)) ≥ 3 against BOTH squares. (The research
 *     doc's "near-white fill ≥ 3:1 vs the light square" is geometrically impossible for a
 *     bright wood board — the rim/sheen treatment is what makes glyphs legible. Decision
 *     ported from the research/designs/board-randomizer.html exploration.)
 *   • square ΔL_oklch ≥ 0.28  — the perceptual lightness gap that makes the grid obvious.
 *
 * Colour maths via `culori` (MIT — clean against our permissive-only guardrail): we use its
 * gamut-preserving `clampChroma` and `formatCss`, and compute WCAG contrast ourselves over
 * its sRGB conversion (its `wcagContrast` needs extra mode registration we don't want).
 */

// `useMode` is culori's mode-registration fn (not a React hook); alias it so the
// react-hooks lint rule doesn't mistake the `use*` name for one.
import {
  useMode as registerColorMode,
  modeOklch,
  modeRgb,
  converter,
  formatCss,
  clampChroma,
} from "culori/fn";
import { seededRandom, shortId } from "./rng";

registerColorMode(modeRgb);
registerColorMode(modeOklch);
const toRgb = converter("rgb");

type OK = { mode: "oklch"; l: number; c: number; h: number; alpha?: number };
const ok = (l: number, c: number, h: number, alpha?: number): OK => ({ mode: "oklch", l, c, h, alpha });

// ---- colour maths -----------------------------------------------------------------
const clampGamut = (color: OK): OK => clampChroma(color, "oklch") as OK;
const srgb = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function luminance(color: OK): number {
  const { r, g, b } = toRgb(color);
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  return 0.2126 * srgb(cl(r)) + 0.7152 * srgb(cl(g)) + 0.0722 * srgb(cl(b));
}
function contrast(a: OK, b: OK): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
const css = (c: OK) => formatCss(c);

// ---- the families (constant L scaffold; seed jitters hue + small chroma) -----------
interface Family {
  name: string;
  nick: string;
  weight: number;
  hue: [number, number];
  light: { L: number; C: number };
  dark: { L: number; C: number };
  white: { L: number; C: number };
  black: { L: number; C: number };
  accOff: number;
  acc: { L: number; C: number };
}

const FAMILIES: Family[] = [
  { name: "Warm wood", nick: "Walnut", weight: 3, hue: [30, 55], light: { L: 0.84, C: 0.045 }, dark: { L: 0.5, C: 0.065 }, white: { L: 0.95, C: 0.015 }, black: { L: 0.22, C: 0.025 }, accOff: 155, acc: { L: 0.6, C: 0.15 } },
  { name: "Cool slate", nick: "Slate", weight: 3, hue: [230, 260], light: { L: 0.82, C: 0.03 }, dark: { L: 0.48, C: 0.05 }, white: { L: 0.96, C: 0.008 }, black: { L: 0.24, C: 0.02 }, accOff: 150, acc: { L: 0.58, C: 0.14 } },
  { name: "Ink & parchment", nick: "Parchment", weight: 3, hue: [70, 90], light: { L: 0.9, C: 0.02 }, dark: { L: 0.42, C: 0.03 }, white: { L: 0.97, C: 0.006 }, black: { L: 0.18, C: 0.015 }, accOff: 180, acc: { L: 0.55, C: 0.13 } },
  { name: "Sage / olive", nick: "Sage", weight: 2, hue: [120, 150], light: { L: 0.83, C: 0.055 }, dark: { L: 0.5, C: 0.07 }, white: { L: 0.95, C: 0.012 }, black: { L: 0.23, C: 0.02 }, accOff: 155, acc: { L: 0.6, C: 0.16 } },
  { name: "Marble", nick: "Marble", weight: 2, hue: [250, 290], light: { L: 0.88, C: 0.015 }, dark: { L: 0.58, C: 0.025 }, white: { L: 0.97, C: 0.005 }, black: { L: 0.26, C: 0.015 }, accOff: 150, acc: { L: 0.58, C: 0.15 } },
  { name: "Jewel tones", nick: "Jewel", weight: 1, hue: [0, 360], light: { L: 0.8, C: 0.07 }, dark: { L: 0.45, C: 0.09 }, white: { L: 0.96, C: 0.01 }, black: { L: 0.2, C: 0.02 }, accOff: 210, acc: { L: 0.55, C: 0.19 } },
];

// ---- public shape ------------------------------------------------------------------
/** CSS custom properties the Board consumes. Emitted as `oklch(...)` for rolls, hex/rgba
 * for the classic default (so the locked Deep-Space board renders byte-identically). */
export interface BoardCssVars {
  "--sq-light": string;
  "--sq-dark": string;
  "--piece-white": string;
  "--piece-white-rim": string;
  "--piece-black": string;
  "--piece-black-rim": string;
  "--board-accent": string;
  "--board-accent-fill": string;
  "--board-accent-glow": string;
  /** Last-move cue. Classic keeps amber (its meaning-bearing token); rolls re-hue to accent,
   * staying distinct from selection by shape (solid fill vs ring). Check stays red elsewhere. */
  "--board-last": string;
  "--board-last-fill": string;
  "--board-frame": string;
  "--coord-on-light": string;
  "--coord-on-dark": string;
}

export interface BoardTheme {
  /** The shareable identity. `"classic"` is the default Deep-Space board. */
  seed: string;
  family: string;
  /** Single-word family label for the nameplate (e.g. "Walnut"). */
  nick: string;
  /** Short stable id shown after the nick (e.g. "4f2a"). */
  shortSeed: string;
  /** Display name, e.g. "Walnut · 4f2a" (or "Classic · deck"). */
  name: string;
  isClassic: boolean;
  vars: BoardCssVars;
  /** Measured guarantees — exposed for tests and the a11y pass. */
  metrics: { minPieceContrast: number; squareDeltaL: number; pass: boolean };
}

// ---- legibility backstop -----------------------------------------------------------
const legSquare = (fill: OK, rim: OK, sq: OK) => Math.max(contrast(fill, sq), contrast(rim, sq));

/** Two-tone piece: nudge rim (then fill) toward its extreme until BOTH squares clear 3:1. */
function ensureLegible(fill: OK, rim: OK, light: OK, dark: OK, fillUp: boolean, rimUp: boolean) {
  for (let i = 0; i < 40; i++) {
    if (legSquare(fill, rim, light) >= 3 && legSquare(fill, rim, dark) >= 3) break;
    rim = clampGamut(ok(rimUp ? Math.min(0.985, rim.l + 0.03) : Math.max(0.03, rim.l - 0.03), rim.c, rim.h));
    fill = clampGamut(ok(fillUp ? Math.min(0.99, fill.l + 0.01) : Math.max(0.04, fill.l - 0.01), fill.c, fill.h));
  }
  return { fill, rim, min: Math.min(legSquare(fill, rim, light), legSquare(fill, rim, dark)) };
}

// ---- the classic Deep-Space default (reset target; renders identically to today) ---
export const CLASSIC_THEME: BoardTheme = {
  seed: "classic",
  family: "Deep-Space Analysis Deck",
  nick: "Classic",
  shortSeed: "deck",
  name: "Classic · deck",
  isClassic: true,
  vars: {
    "--sq-light": "#5c7382",
    "--sq-dark": "#1b2733",
    "--piece-white": "#f5fbfb",
    "--piece-white-rim": "rgba(0,0,0,0.55)",
    "--piece-black": "#0b1118",
    "--piece-black-rim": "rgba(70,224,208,0.65)",
    "--board-accent": "#46e0d0",
    "--board-accent-fill": "rgba(70,224,208,0.16)",
    "--board-accent-glow": "rgba(70,224,208,0.45)",
    "--board-last": "rgba(255,180,84,0.6)",
    "--board-last-fill": "rgba(255,180,84,0.22)",
    "--board-frame": "#46e0d0",
    "--coord-on-light": "rgba(15,22,30,0.82)",
    "--coord-on-dark": "rgba(157,176,188,0.8)",
  },
  metrics: { minPieceContrast: 4.8, squareDeltaL: 0.32, pass: true },
};

/**
 * Generate a board palette from a seed string. Pure + deterministic: same seed → same board.
 * Draw order is fixed (family → hue → chroma jitter → accent) so the stream stays stable.
 */
export function generateBoardTheme(seed: string): BoardTheme {
  const rand = seededRandom(seed);

  // 1. weighted family pick (safe families common, jewel rare)
  const total = FAMILIES.reduce((s, f) => s + f.weight, 0);
  let t = rand() * total;
  let fam = FAMILIES[0];
  for (const f of FAMILIES) {
    if (t < f.weight) {
      fam = f;
      break;
    }
    t -= f.weight;
  }

  // 2. base hue within the family band; dark square allowed ≤ ±8° drift
  const H = fam.hue[0] + rand() * (fam.hue[1] - fam.hue[0]);
  const Hdark = H + (rand() - 0.5) * 16;
  const jit = (c: number) => Math.max(0, c + (rand() - 0.5) * 0.012);

  // 3. squares (large fills → low chroma) + accent (split-complementary, high chroma)
  let light = clampGamut(ok(fam.light.L, Math.min(0.08, jit(fam.light.C)), H));
  let dark = clampGamut(ok(fam.dark.L, Math.min(0.09, jit(fam.dark.C)), Hdark));
  let accent = clampGamut(ok(fam.acc.L, fam.acc.C, (H + fam.accOff) % 360));

  // 4. backstop — square ΔL ≥ 0.28
  const dL = light.l - dark.l;
  if (dL < 0.28) {
    const def = (0.28 - dL) / 2;
    light = clampGamut(ok(Math.min(0.97, light.l + def), light.c, light.h));
    dark = clampGamut(ok(Math.max(0.3, dark.l - def), dark.c, dark.h));
  }

  // 5. two-tone pieces — white: light fill + dark rim; black: dark fill + light rim
  const W = ensureLegible(ok(fam.white.L, fam.white.C, H), ok(0.18, 0.012, H), light, dark, true, false);
  const B = ensureLegible(ok(fam.black.L, fam.black.C, H), ok(0.92, 0.012, H), light, dark, false, true);

  // 6. accent mud-zone fix (L .40–.60 ∧ C .05–.12 reads as neither colour nor neutral):
  //    brighten L to recover committed chroma. (Squares are governed by C≤.08 ∧ ΔL, not this.)
  if (accent.l >= 0.4 && accent.l <= 0.6 && accent.c >= 0.05 && accent.c <= 0.12) {
    accent = clampGamut(ok(0.7, Math.max(accent.c, 0.14), accent.h));
  }

  const minPieceContrast = Math.min(W.min, B.min);
  const squareDeltaL = light.l - dark.l;
  // coordinate ink: a touch darker than the dark square (on light squares), lighter than
  // the light square (on dark squares) — always legible, family-tinted.
  const coordOnLight = clampGamut(ok(Math.max(0.12, dark.l - 0.1), 0.01, dark.h));
  const coordOnDark = clampGamut(ok(Math.min(0.92, light.l + 0.02), 0.01, light.h));

  const id = shortId(seed);
  return {
    seed,
    family: fam.name,
    nick: fam.nick,
    shortSeed: id,
    name: `${fam.nick} · ${id}`,
    isClassic: false,
    vars: {
      "--sq-light": css(light),
      "--sq-dark": css(dark),
      "--piece-white": css(W.fill),
      "--piece-white-rim": css(W.rim),
      "--piece-black": css(B.fill),
      "--piece-black-rim": css(B.rim),
      "--board-accent": css(accent),
      "--board-accent-fill": css({ ...accent, alpha: 0.26 }),
      "--board-accent-glow": css({ ...accent, alpha: 0.5 }),
      "--board-last": css(accent),
      "--board-last-fill": css({ ...accent, alpha: 0.26 }),
      "--board-frame": css({ ...accent, c: accent.c * 0.6 }),
      "--coord-on-light": css(coordOnLight),
      "--coord-on-dark": css(coordOnDark),
    },
    metrics: { minPieceContrast, squareDeltaL, pass: minPieceContrast >= 3 && squareDeltaL >= 0.28 },
  };
}

/** Resolve a stored/shared seed to a theme. Falsy or `"classic"` → the default board. */
export function themeForSeed(seed: string | null | undefined): BoardTheme {
  if (!seed || seed === "classic") return CLASSIC_THEME;
  return generateBoardTheme(seed);
}

/** A fresh, shareable random seed for a reroll (UI-only; not deterministic). */
export function randomBoardSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}
