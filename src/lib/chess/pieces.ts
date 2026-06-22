import type { Color, PieceSymbol } from "chess.js";

/** Unicode chess glyphs, keyed by piece symbol. We render a single glyph set and
 * colour it via CSS (.w / .b) so white and black read clearly on both square tones. */
export const GLYPH: Record<PieceSymbol, string> = {
  k: "♚", // ♚
  q: "♛", // ♛
  r: "♜", // ♜
  b: "♝", // ♝
  n: "♞", // ♞
  p: "♟", // ♟
};

const NAMES: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

export function pieceName(color: Color, type: PieceSymbol): string {
  return `${color === "w" ? "white" : "black"} ${NAMES[type]}`;
}

/** Bare piece-type word ("knight"), no colour — used to gloss SAN into plain language. */
export function pieceTypeName(type: PieceSymbol): string {
  return NAMES[type];
}

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
