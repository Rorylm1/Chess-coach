/**
 * Deterministic legibility backstop for a generated TableSpec — no LLM, pure code.
 *
 * Whatever Claude invents, this guarantees the board is readable: light vs dark squares
 * stay distinct, each two-tone piece (fill + opposite-lightness rim) clears 3:1 against
 * BOTH square tones, and body text clears its surfaces where a shared ink is possible. The board is the hero; it can
 * never come back broken. (sRGB WCAG math on hex — mirrors the sandbox generator.)
 */

import type { TableSpec } from "./spec";

interface Rgb { r: number; g: number; b: number; }

function hexToRgb(h: string): Rgb {
  let s = String(h).replace("#", "").trim();
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) s = "808080";
  const n = parseInt(s, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function toHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("");
}
export function relLum({ r, g, b }: Rgb): number {
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrast(a: Rgb, z: Rgb): number {
  const x = relLum(a), y = relLum(z), hi = Math.max(x, y), lo = Math.min(x, y);
  return (hi + 0.05) / (lo + 0.05);
}
const ct = (a: string, b: string) => contrast(hexToRgb(a), hexToRgb(b));
/** A piece is two-tone; whichever tone contrasts the square carries legibility. */
const legSq = (fill: string, rim: string, sq: string) => Math.max(ct(fill, sq), ct(rim, sq));
/** Nudge a hex toward white (dir>0) or black (dir<0). */
function pushL(hex: string, dir: number, step = 0.06): string {
  const c = hexToRgb(hex), t = dir > 0 ? 1 : 0, k = step * 3;
  return toHex({ r: c.r + (t - c.r) * k, g: c.g + (t - c.g) * k, b: c.b + (t - c.b) * k });
}

/**
 * Find the closest tint/shade that reads across all the supplied backgrounds. Sampling
 * at channel precision is bounded, keeps the original hue, and can move in either
 * direction (the page background and the panel need not have the same value).
 *
 * Some combinations of surfaces have no common accessible ink. In that case preserve
 * their palette, guarantee the primary surface, and maximize the worst remaining ratio.
 */
function repairInk(hex: string, backgrounds: string[], primary = backgrounds[0]): string {
  const floor = 4.5;
  const original = hexToRgb(hex);
  const luminances = backgrounds.map((background) => relLum(hexToRgb(background)));
  const primaryLum = relLum(hexToRgb(primary));
  const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const worst = (lum: number) => Math.min(...luminances.map((background) => ratio(lum, background)));
  if (worst(relLum(original)) >= floor) return hex;

  let closest: string | undefined;
  let closestDistance = Infinity;
  let fallback = hex;
  let fallbackScore = -Infinity;
  // Include pure black and white: at least one always clears 4.5 on a single surface.
  for (const target of [0, 1]) {
    for (let step = 0; step <= 255; step++) {
      const amount = step / 255;
      const candidate = toHex({
        r: original.r + (target - original.r) * amount,
        g: original.g + (target - original.g) * amount,
        b: original.b + (target - original.b) * amount,
      });
      const rgb = hexToRgb(candidate);
      const lum = relLum(rgb);
      const score = worst(lum);
      const distance = (rgb.r - original.r) ** 2 + (rgb.g - original.g) ** 2 + (rgb.b - original.b) ** 2;
      if (score >= floor && distance < closestDistance) {
        closest = candidate;
        closestDistance = distance;
      }
      if (ratio(lum, primaryLum) >= floor && score > fallbackScore) {
        fallback = candidate;
        fallbackScore = score;
      }
    }
  }
  return closest ?? fallback;
}

/** Repair the board palette in place-ish (returns a corrected copy of the relevant fields). */
export function backstopBoard(s: TableSpec): TableSpec {
  const out = { ...s };
  // 1. squares must read as two distinct tones
  let g = 0;
  while (ct(out.boardLight, out.boardDark) < 1.7 && g++ < 24) {
    if (relLum(hexToRgb(out.boardLight)) >= relLum(hexToRgb(out.boardDark))) {
      out.boardLight = pushL(out.boardLight, +1); out.boardDark = pushL(out.boardDark, -1);
    } else {
      out.boardLight = pushL(out.boardLight, -1); out.boardDark = pushL(out.boardDark, +1);
    }
  }
  // 2. Keep the two armies recognizable even when the model gives both the same fill.
  // Preserve their hues while establishing the familiar lighter-white/darker-black order.
  g = 0;
  while ((ct(out.pieceWhite, out.pieceBlack) < 2 ||
    relLum(hexToRgb(out.pieceWhite)) <= relLum(hexToRgb(out.pieceBlack))) && g++ < 40) {
    out.pieceWhite = pushL(out.pieceWhite, +1, 0.03);
    out.pieceBlack = pushL(out.pieceBlack, -1, 0.03);
  }
  // 3. two-tone pieces: drive the rim to the fill's opposite extreme until both squares pass 3:1
  const fix = (fill: string, rim: string, fillDir: number) => {
    let f = fill, r = rim, n = 0;
    while ((legSq(f, r, out.boardLight) < 3 || legSq(f, r, out.boardDark) < 3) && n++ < 40) {
      r = pushL(r, fillDir > 0 ? -1 : +1);
      f = pushL(f, fillDir > 0 ? +1 : -1, 0.03);
    }
    return { f, r };
  };
  const w = fix(out.pieceWhite, out.pieceWhiteRim, +1);
  out.pieceWhite = w.f; out.pieceWhiteRim = w.r;
  const k = fix(out.pieceBlack, out.pieceBlackRim, -1);
  out.pieceBlack = k.f; out.pieceBlackRim = k.r;
  // Coordinates are tiny body text, and must be checked against the repaired squares.
  out.coordOnLight = repairInk(out.coordOnLight, [out.boardLight]);
  out.coordOnDark = repairInk(out.coordOnDark, [out.boardDark]);
  return out;
}

/** Body text and accent-colored labels must be readable on the surfaces. */
export function backstopInk(s: TableSpec): TableSpec {
  const out = { ...s };
  const surfaces = [out.panel, out.panel2, out.surface, out.bg];
  out.ink = repairInk(out.ink, surfaces);
  out.inkSoft = repairInk(out.inkSoft, surfaces);
  out.inkFaint = repairInk(out.inkFaint, surfaces);
  // Both accent tiers also color small labels and controls, not only decoration.
  out.accentInteractive = repairInk(out.accentInteractive, surfaces);
  out.accentInteractiveDim = repairInk(out.accentInteractiveDim, surfaces);
  out.accentEval = repairInk(out.accentEval, surfaces);
  out.accentEvalDim = repairInk(out.accentEvalDim, surfaces);
  return out;
}

/** Full backstop pass. */
export function backstop(s: TableSpec): TableSpec {
  return backstopInk(backstopBoard(s));
}

/** Quick metrics for logging/QA (min piece-vs-square contrast and square ΔcontrastL). */
export function legibilityOf(s: TableSpec): { minPiece: number; squares: number; pass: boolean } {
  const minPiece = Math.min(
    legSq(s.pieceWhite, s.pieceWhiteRim, s.boardLight),
    legSq(s.pieceWhite, s.pieceWhiteRim, s.boardDark),
    legSq(s.pieceBlack, s.pieceBlackRim, s.boardLight),
    legSq(s.pieceBlack, s.pieceBlackRim, s.boardDark),
  );
  const squares = ct(s.boardLight, s.boardDark);
  return { minPiece, squares, pass: minPiece >= 3 && squares >= 1.7 };
}
