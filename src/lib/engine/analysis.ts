/**
 * Engine-analysis vocabulary: the eval type and the pure math around it.
 *
 * This file is deliberately Worker-free so it can be imported anywhere — components,
 * the grounding payload, and unit tests — without instantiating Stockfish. The actual
 * UCI search lives in `engine.ts` (`ChessEngine.analyse`); here we only define what an
 * evaluation *is* and how to read it.
 *
 * Convention: an `Eval` is always normalized to **White's perspective** (positive = good
 * for White), so the whole app speaks one dialect. Stockfish reports relative to the side
 * to move; `lineToWhiteEval` does the flip.
 */

import type { Chess } from "chess.js";

/** Engine evaluation of a position, from White's perspective. Exactly one of cp / mate
 *  is non-null. */
export interface Eval {
  /** Centipawns, White POV (null when a forced mate is known). */
  cp: number | null;
  /** Mate distance, White POV: +N = White mates in N, -N = Black mates in N. null
   *  when the eval is centipawns rather than a forced mate. */
  mate: number | null;
}

/** One principal-variation line the engine returned for a position, as Stockfish
 *  reports it (relative to the side to move). */
export interface AnalysisLine {
  /** Search depth reached, in plies. */
  depth: number;
  /** Centipawns, side-to-move POV (null on mate). */
  cp: number | null;
  /** Mate distance, side-to-move POV (null when not mate). */
  mate: number | null;
  /** Best move = first move of the PV, UCI long-algebraic ("g1f3", "e7e8q"). */
  bestMoveUci: string | null;
  /** Principal variation, UCI long-algebraic. */
  pvUci: string[];
}

/** Depth/time budgets. Shallow for live in-game eval (snappy, runs beside the bot);
 *  deeper for post-game review (M4) where accuracy matters more than latency. */
export const IN_GAME_ANALYSIS = { depth: 14, movetime: 900 } as const;
export const REVIEW_ANALYSIS = { depth: 18, movetime: 2500 } as const;

/** cp magnitude that maps to a near-certain result when computing win% / bar fill. */
const CP_CLAMP = 1000;
/** Sentinel cp magnitude for a position that is *already* checkmate on the board (no
 *  legal move). Far above any real engine cp, so it reads as a decisive result. */
export const MATE_CP = 100_000;

/** Flip a side-to-move-relative engine line into a White-POV eval. */
export function lineToWhiteEval(line: AnalysisLine, sideToMove: "w" | "b"): Eval {
  const sign = sideToMove === "w" ? 1 : -1;
  if (line.mate != null) return { cp: null, mate: line.mate * sign };
  return { cp: (line.cp ?? 0) * sign, mate: null };
}

/** A position the engine has evaluated, normalized to White's POV. The unit the grounding
 *  layer consumes: an eval plus the best move + PV that justify it. */
export interface PositionEval {
  /** White-POV eval. */
  eval: Eval;
  /** Search depth reached (0 for a synthesized terminal eval). */
  depth: number;
  /** Engine's best move, UCI (null if terminal / none). */
  bestUci: string | null;
  /** Principal variation, UCI. */
  pvUci: string[];
}

/** Read the side to move out of a FEN's second field. */
export function sideToMove(fen: string): "w" | "b" {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

/** Normalize a raw engine line (side-to-move POV) into a White-POV {@link PositionEval}. */
export function lineToPositionEval(line: AnalysisLine, fen: string): PositionEval {
  return {
    eval: lineToWhiteEval(line, sideToMove(fen)),
    depth: line.depth,
    bestUci: line.bestMoveUci,
    pvUci: line.pvUci,
  };
}

/** White-POV eval of a *finished* position (no legal moves). null if the game isn't over.
 *  Checkmate is encoded with the {@link MATE_CP} cp sentinel (whose sign carries the
 *  winner); any draw is dead level. */
export function terminalEval(game: Chess): Eval | null {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) {
    // The side to move has been mated.
    return { cp: game.turn() === "w" ? -MATE_CP : MATE_CP, mate: null };
  }
  return { cp: 0, mate: null }; // stalemate, insufficient material, repetition, 50-move
}

/** White's winning chance for a position, 0–100. The product's win-probability spine:
 *  a logistic on centipawns (Lichess-derived constant), with mates pinned to 0/100. */
export function whiteWinPct(e: Eval): number {
  if (e.mate != null) return e.mate > 0 ? 100 : e.mate < 0 ? 0 : 50;
  const raw = e.cp ?? 0;
  if (Math.abs(raw) >= MATE_CP) return raw > 0 ? 100 : 0;
  const cp = Math.max(-CP_CLAMP, Math.min(CP_CLAMP, raw));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Winning chance for a given side, 0–100. */
export function winPctFor(e: Eval, side: "w" | "b"): number {
  const white = whiteWinPct(e);
  return side === "w" ? white : 100 - white;
}

/** Human-facing eval string, White POV: "+1.2", "-0.8", "0.0", "M3", "-M2", "#". */
export function formatEval(e: Eval): string {
  if (e.cp != null && Math.abs(e.cp) >= MATE_CP) return e.cp > 0 ? "#" : "-#";
  if (e.mate != null) {
    if (e.mate === 0) return "#";
    return e.mate > 0 ? `M${e.mate}` : `-M${-e.mate}`;
  }
  const pawns = (e.cp ?? 0) / 100;
  const rounded = pawns.toFixed(1);
  if (rounded === "0.0" || rounded === "-0.0") return "0.0";
  return pawns > 0 ? `+${rounded}` : rounded;
}
