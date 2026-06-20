/**
 * Deterministic move classification — computed in code, never by the LLM.
 *
 * The judgement is **win-probability based**, not raw centipawns. We compare the moving
 * side's winning chance before their move (best play available) with their winning chance
 * after the move they actually made; the drop is the verdict. Using win% instead of cp is
 * what stops a +9 → +5 "blunder" false-positive in a totally won position (both ~99%, so
 * a near-zero drop) — a documented chess.com pain point the spec calls out.
 *
 * Pure and side-effect-free, so `classify` can be unit-tested against known positions.
 */

import { winPctFor, type Eval } from "@/lib/engine/analysis";

export type MoveQuality = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

/** Win% drop thresholds (Lichess-style). A move costing the mover ≥30% of their winning
 *  chance is a blunder, ≥20% a mistake, ≥10% an inaccuracy. */
export const BLUNDER_DROP = 30;
export const MISTAKE_DROP = 20;
export const INACCURACY_DROP = 10;

export interface ClassifyInput {
  /** White-POV eval of the position *before* the move (mover is to play). */
  evalBefore: Eval;
  /** White-POV eval of the position *after* the move. */
  evalAfter: Eval;
  /** Which side made the move. */
  mover: "w" | "b";
  /** Whether the move played is the engine's top choice in the before-position. */
  isBest: boolean;
}

export interface Classification {
  quality: MoveQuality;
  /** Mover's winning chance before the move, 0–100. */
  winBefore: number;
  /** Mover's winning chance after the move, 0–100. */
  winAfter: number;
  /** How much winning chance the move cost the mover (≥0). */
  winDrop: number;
}

/** Classify a single move from the before/after evals (both White-POV). */
export function classify(input: ClassifyInput): Classification {
  const winBefore = winPctFor(input.evalBefore, input.mover);
  const winAfter = winPctFor(input.evalAfter, input.mover);
  // Clamp at 0: search-horizon noise can make a "best" move look marginally better than
  // the engine's own prior line, which isn't a real gain.
  const winDrop = Math.max(0, winBefore - winAfter);

  let quality: MoveQuality;
  if (winDrop >= BLUNDER_DROP) quality = "blunder";
  else if (winDrop >= MISTAKE_DROP) quality = "mistake";
  else if (winDrop >= INACCURACY_DROP) quality = "inaccuracy";
  else quality = input.isBest ? "best" : "good";

  return { quality, winBefore, winAfter, winDrop };
}

export interface QualityMeta {
  /** Human label for the coach voice and tooltips. */
  label: string;
  /** Compact annotation symbol shown next to the move (chess convention). */
  symbol: string;
  /** CSS custom-property name carrying this quality's accent colour. */
  colorVar: string;
  /** Whether this quality is a mistake worth surfacing as a "key moment". */
  isError: boolean;
}

export const QUALITY_META: Record<MoveQuality, QualityMeta> = {
  best: { label: "Best move", symbol: "✦", colorVar: "--q-best", isError: false },
  good: { label: "Good", symbol: "", colorVar: "--q-good", isError: false },
  inaccuracy: { label: "Inaccuracy", symbol: "?!", colorVar: "--q-inaccuracy", isError: true },
  mistake: { label: "Mistake", symbol: "?", colorVar: "--q-mistake", isError: true },
  blunder: { label: "Blunder", symbol: "??", colorVar: "--q-blunder", isError: true },
};
