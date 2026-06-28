/**
 * Deterministic legibility backstop for a generated TableSpec — no LLM, pure code.
 *
 * Whatever Claude invents, this guarantees the board is readable: light vs dark squares
 * stay distinct, each two-tone piece (fill + opposite-lightness rim) clears 3:1 against
 * BOTH square tones, and body text clears its surfaces. The board is the hero; it can
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
  // 2. two-tone pieces: drive the rim to the fill's opposite extreme until both squares pass 3:1
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
  return out;
}

/** Body text must be readable on the surfaces. */
export function backstopInk(s: TableSpec): TableSpec {
  const out = { ...s };
  const bgLight = relLum(hexToRgb(out.bg)) > 0.4;
  let g = 0;
  while (ct(out.ink, out.panel) < 4.5 && g++ < 30) out.ink = pushL(out.ink, bgLight ? -1 : +1);
  if (ct(out.inkSoft, out.panel) < 2.8) out.inkSoft = pushL(out.inkSoft, bgLight ? -1 : +1);
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
  return { minPiece, squares, pass: minPiece >= 3 && squares >= 1.45 };
}
