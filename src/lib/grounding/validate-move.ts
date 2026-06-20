/**
 * Move validator — the anti-hallucination gate.
 *
 * The LLM is forbidden from inventing chess, but it still produces *text*; before any
 * move it names reaches the screen we run it through here. The move must (a) be legal in
 * the given position per chess.js, and optionally (b) actually appear in the engine's PV.
 * M3's coaching loop uses this to reject/regenerate a response that cites a move the
 * engine never suggested. Accepts both SAN ("Nf3", "exd5", "O-O", "e8=Q") and UCI
 * ("g1f3", "e7e8q"), and is forgiving of the annotations an LLM tends to append ("Nf3!",
 * "Qxh7#").
 */

import { Chess, type Move } from "chess.js";

export interface MoveValidation {
  /** Is the move legal in this position? */
  legal: boolean;
  /** Canonical SAN, if legal. */
  san: string | null;
  /** Canonical UCI long-algebraic, if legal. */
  uci: string | null;
  /** Does the move match the engine's top choice (first move of the PV)? */
  isBest: boolean;
  /** Does the move appear anywhere in the supplied PV? */
  inPv: boolean;
  /** Why validation failed (null on success) — useful for logging / regeneration. */
  reason: string | null;
}

const UCI_RE = /^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/;

function fail(reason: string): MoveValidation {
  return { legal: false, san: null, uci: null, isBest: false, inPv: false, reason };
}

/** Find the legal move in `position` that a (possibly loosely-formatted) string denotes. */
function findLegalMove(game: Chess, raw: string): Move | null {
  const legal = game.moves({ verbose: true });

  if (UCI_RE.test(raw)) {
    const from = raw.slice(0, 2);
    const to = raw.slice(2, 4);
    const promo = raw.length > 4 ? raw[4].toLowerCase() : undefined;
    return (
      legal.find(
        (m) => m.from === from && m.to === to && (m.promotion ?? undefined) === promo,
      ) ?? null
    );
  }

  // SAN. Try chess.js's own (non-strict) parser on a throwaway board first — it handles
  // captures, promotions and castling robustly — then fall back to a cleaned match.
  const candidates = [raw, raw.replace(/[!?]+$/g, ""), raw.replace(/0/g, "O")];
  for (const c of candidates) {
    try {
      const m = new Chess(game.fen()).move(c);
      return legal.find((lm) => lm.lan === m.lan) ?? null;
    } catch {
      // not parseable as-is; try the next normalization
    }
  }
  return null;
}

/**
 * Validate a move string against a position (and optionally an engine PV).
 *
 * @param fen      position the move is claimed to be played in
 * @param move     the move, SAN or UCI, possibly with trailing annotations
 * @param opts.pvUci  engine principal variation (UCI) to check membership against
 */
export function validateMove(
  fen: string,
  move: string,
  opts?: { pvUci?: string[] },
): MoveValidation {
  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return fail("invalid FEN");
  }

  const raw = move.trim();
  if (!raw) return fail("empty move");

  const match = findLegalMove(game, raw);
  if (!match) return fail("illegal move in this position");

  const pv = opts?.pvUci ?? [];
  return {
    legal: true,
    san: match.san,
    uci: match.lan,
    isBest: pv.length > 0 && pv[0] === match.lan,
    inPv: pv.includes(match.lan),
    reason: null,
  };
}
