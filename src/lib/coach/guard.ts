/**
 * The anti-hallucination guard — pure and testable, shared by the coaching route.
 *
 * Grounding is structural first (the prompt only offers a closed move vocabulary), so this is
 * the backstop: scan the coach's prose for any move it *named* and confirm each is both legal
 * in the position and one of the moves we actually offered. A named move that's illegal, or
 * legal-but-not-offered, fails the guard and the route regenerates / falls back. The product
 * therefore can never surface a move the engine didn't put on the table.
 */

import { validateMove } from "@/lib/grounding/validate-move";
import { vocabulary, type CoachPayload } from "@/lib/coach/payload";

/** Unambiguous SAN moves: piece moves, captures, castling, promotions. Deliberately excludes
 *  bare pawn pushes ("e4") so square references ("the pawn on e4") aren't mistaken for moves. */
const SAN_MOVE =
  /\b(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8]=[QRBN][+#]?)\b/g;
/** UCI long-algebraic ("g1f3", "e7e8q") — always a move, never a square reference. */
const UCI_MOVE = /\b[a-h][1-8][a-h][1-8][qrbn]?\b/g;

/** Every move-looking token the prose names (deduped). */
export function namedMoves(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(SAN_MOVE)) out.add(m[0]);
  for (const m of text.matchAll(UCI_MOVE)) out.add(m[0]);
  return [...out];
}

/** Strip the cosmetics an LLM tacks on (annotations, check/mate marks, "0-0" for "O-O") so a
 *  token compares equal to a stored SAN regardless of spelling. */
function normalizeSan(s: string): string {
  return s.replace(/[!?]+$/g, "").replace(/[+#]+$/g, "").replace(/0/g, "O");
}

/**
 * True if the prose names any move outside what we offered.
 *
 * We first accept any token that matches an offered SAN/UCI (this covers the *whole* PV line,
 * including the opponent's deeper replies that are legal later but not in `fen`). Only tokens
 * that don't match an offered move are validated against `fen` — and flagged if they're illegal
 * or a legal-but-unoffered alternative. That way walking the engine's line never false-fails,
 * but inventing a move always does.
 */
export function hasUngroundedMove(text: string, payload: CoachPayload): boolean {
  const allowed = new Set<string>(payload.pvUci);
  for (const e of vocabulary(payload)) {
    allowed.add(e.uci);
    allowed.add(normalizeSan(e.san));
  }

  for (const token of namedMoves(text)) {
    if (allowed.has(token) || allowed.has(normalizeSan(token))) continue; // an offered move
    const v = validateMove(payload.fen, token, { pvUci: payload.pvUci });
    if (v.legal && v.uci && allowed.has(v.uci)) continue; // same move, different spelling
    return true; // illegal, or a real move we never put on the table
  }
  return false;
}
