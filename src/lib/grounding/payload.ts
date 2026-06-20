/**
 * The grounding payload — the single source of chess facts.
 *
 * A `MoveFact` is everything the coach (M3) is allowed to reason from for one move: the
 * position before/after, the move played, the engine's verdict (eval + classification),
 * and the engine's recommendation (best move + PV in SAN). The LLM never computes any of
 * this; it only narrates what's in here, and every move it names is checked back against
 * `validate-move`. Building it in one place keeps "engine truth" and "human teaching"
 * cleanly separated.
 *
 * Pure: given the SAN history and a per-FEN eval lookup, it assembles the facts. The
 * lookup is async-friendly in practice (the live hook fills a cache over time), so facts
 * for not-yet-evaluated positions come back with null evals and no classification — the
 * UI shows the move immediately and the verdict lands when the engine catches up.
 */

import { Chess } from "chess.js";
import { classify, type Classification, type MoveQuality } from "@/lib/classify";
import { terminalEval, type Eval, type PositionEval } from "@/lib/engine/analysis";

export interface MoveFact {
  /** 0-based ply index within the game. */
  ply: number;
  /** Full-move number (1, 1, 2, 2, …). */
  moveNumber: number;
  /** Side that made the move. */
  color: "w" | "b";
  /** Move played, in SAN. */
  san: string;
  /** Move played, in UCI long-algebraic. */
  uci: string;
  /** FEN before the move (the position the mover faced). */
  fenBefore: string;
  /** FEN after the move. */
  fenAfter: string;
  /** White-POV eval before the move (null until evaluated). */
  evalBefore: Eval | null;
  /** White-POV eval after the move (null until evaluated). */
  evalAfter: Eval | null;
  /** Full classification (win% before/after + drop + quality), null until evaluated. */
  classification: Classification | null;
  /** Convenience mirror of classification.quality. */
  quality: MoveQuality | null;
  /** Engine's best move in the before-position, SAN (null until evaluated). */
  bestSan: string | null;
  /** Engine's best move in the before-position, UCI. */
  bestUci: string | null;
  /** Engine's principal variation from the before-position, in SAN. */
  pvSan: string[];
}

/** Per-FEN eval provider. Returns undefined for positions not yet evaluated. */
export type EvalLookup = (fen: string) => PositionEval | undefined;

/** How many plies of the engine's recommended line to surface in SAN. */
const PV_SAN_DEPTH = 8;

/** Convert a UCI principal variation into SAN by replaying it from a position. */
export function pvToSan(fen: string, pvUci: string[], max = PV_SAN_DEPTH): string[] {
  const game = new Chess(fen);
  const out: string[] = [];
  for (const uci of pvUci.slice(0, max)) {
    try {
      const move = game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined,
      });
      out.push(move.san);
    } catch {
      break; // PV no longer applies (shouldn't happen for a fresh engine line); stop here.
    }
  }
  return out;
}

/** Assemble the move-by-move facts for a game from its SAN history and an eval lookup. */
export function buildMoveFacts(history: string[], lookup: EvalLookup): MoveFact[] {
  const facts: MoveFact[] = [];
  const game = new Chess();

  for (let i = 0; i < history.length; i++) {
    const fenBefore = game.fen();
    let move;
    try {
      move = game.move(history[i]);
    } catch {
      break; // history is trusted (it came from chess.js), but never throw here
    }
    const fenAfter = game.fen();

    const before = lookup(fenBefore);
    // Prefer a real engine eval of the after-position; for the final mating/drawing move
    // there is no legal reply to search, so synthesize the terminal eval from the board.
    const afterEval: Eval | null = lookup(fenAfter)?.eval ?? terminalEval(game);

    let bestSan: string | null = null;
    let pvSan: string[] = [];
    if (before) {
      pvSan = pvToSan(fenBefore, before.pvUci);
      bestSan = pvSan[0] ?? null;
    }

    let classification: Classification | null = null;
    if (before && afterEval) {
      classification = classify({
        evalBefore: before.eval,
        evalAfter: afterEval,
        mover: move.color,
        isBest: before.bestUci != null && before.bestUci === move.lan,
      });
    }

    facts.push({
      ply: i,
      moveNumber: Math.floor(i / 2) + 1,
      color: move.color,
      san: move.san,
      uci: move.lan,
      fenBefore,
      fenAfter,
      evalBefore: before?.eval ?? null,
      evalAfter: afterEval,
      classification,
      quality: classification?.quality ?? null,
      bestSan,
      bestUci: before?.bestUci ?? null,
      pvSan,
    });
  }

  return facts;
}
