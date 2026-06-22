/**
 * The coach payload — the *only* thing the LLM is allowed to reason from.
 *
 * M3's grounding is **structural, not corrective**: rather than letting Claude write a move
 * and then catching hallucinations after the fact, we hand it a fixed *vocabulary* of moves
 * (the move played, the engine's best move, the moves of its principal variation) and forbid
 * it from naming anything else. Each move carries a **pre-computed plain-language gloss**
 * ("Nf3 — knight to f3", "Qxh7+ — queen takes the pawn on h7 with check") so the model never
 * even translates notation itself — it quotes a string we generated from `chess.js`. That
 * removes both hallucination vectors (inventing a move, mis-describing a move) at the source.
 * `validate-move` then runs server-side as a cheap backstop, not the primary defense.
 *
 * Pure and Worker-free: built from the M2 `MoveFact` / `PositionEval`, never re-derives chess.
 */

import { Chess, type Move } from "chess.js";
import { type MoveQuality, type Classification, QUALITY_META } from "@/lib/classify";
import {
  formatEval,
  sideToMove,
  winPctFor,
  type Eval,
  type PositionEval,
} from "@/lib/engine/analysis";
import { pieceTypeName } from "@/lib/chess/pieces";
import type { MoveFact } from "@/lib/grounding/payload";

/** How far a coaching tip is allowed to escalate. Each is a separate, user-driven step. */
export type HintTier = "nudge" | "concept" | "candidate" | "line";

/** One move the coach may reference, with the words it must use to describe it. */
export interface MoveVocabEntry {
  /** Canonical SAN, e.g. "Nf3". */
  san: string;
  /** UCI long-algebraic, e.g. "g1f3". */
  uci: string;
  /** Plain-language description the coach quotes verbatim, e.g. "knight to f3". */
  gloss: string;
}

/** The complete, self-contained brief sent to the coaching route. */
export interface CoachPayload {
  /** Forward-looking hint about the position to play, or backward-looking move explanation. */
  surface: "hint" | "explain";
  /** Escalation level (hint only; null for explain). */
  tier: HintTier | null;
  /** The position the coaching concerns: the current position (hint) or the pre-move one (explain). */
  fen: string;
  /** Side to move in `fen`. */
  toMove: "w" | "b";
  /** Which colour the human is playing — lets the coach address "you". */
  playerColor: "w" | "b";
  /** Full-move number for context ("move 14"). */
  moveNumber: number;
  /** White-POV eval of `fen` (the position faced), e.g. "+0.3", "-1.8", "M3". */
  evalText: string;
  /** Plain-language read of `fen` from the *player's* perspective, computed in code — so the
   *  coach never has to interpret the eval sign (a framing-error vector). "" when unknown. */
  assessment: string;
  /** Engine's best move from `fen`. */
  best: MoveVocabEntry | null;
  /** Engine's principal variation from `fen`, in order — part of the allowed vocabulary. */
  pv: MoveVocabEntry[];
  /** Raw PV in UCI, for the server-side validate-move backstop. */
  pvUci: string[];
  /** The move the human (or bot) actually played — present for "explain". */
  played: MoveVocabEntry | null;
  /** Classification of the played move (explain only). */
  quality: MoveQuality | null;
  /** Human label for the quality, e.g. "Blunder" (explain only). */
  qualityLabel: string | null;
  /** White-POV eval *after* the played move (explain only). */
  evalAfterText: string | null;
  /** Winning-chance % the played move cost the mover, rounded (explain only). */
  winDrop: number | null;
  /** Recent moves leading to `fen`, in SAN (oldest → newest), for narrative continuity. */
  sanTail: string[];
}

const SAN_TAIL = 6;

/** A grounded, code-computed phrase for "how is the player doing" from a White-POV eval. */
function assess(e: Eval | null, player: "w" | "b"): string {
  if (!e) return "";
  const win = winPctFor(e, player);
  if (win >= 85) return "you're winning comfortably";
  if (win >= 62) return "you're better";
  if (win >= 42) return "it's roughly balanced";
  if (win >= 18) return "you're worse";
  return "you're in serious trouble";
}

/** Glossing: turn one chess.js verbose move into the plain-language phrase the coach quotes. */
function glossMove(m: Move): string {
  if (m.flags.includes("k")) return "castles kingside";
  if (m.flags.includes("q")) return "castles queenside";

  const isCapture = m.captured != null || m.flags.includes("e");
  let core: string;
  if (m.piece === "p") {
    core = isCapture ? `pawn takes on ${m.to}` : `pawn to ${m.to}`;
  } else {
    const piece = pieceTypeName(m.piece);
    const taken = m.captured ? `the ${pieceTypeName(m.captured)} ` : "";
    core = isCapture ? `${piece} takes ${taken}on ${m.to}` : `${piece} to ${m.to}`;
  }
  if (m.promotion) core += `, promoting to a ${pieceTypeName(m.promotion)}`;

  if (m.san.endsWith("#")) core += " — checkmate";
  else if (m.san.endsWith("+")) core += " with check";
  return core;
}

function entry(m: Move): MoveVocabEntry {
  return { san: m.san, uci: m.lan, gloss: glossMove(m) };
}

/** Resolve a single SAN/UCI move against a position into a vocab entry (null if it doesn't apply). */
function single(fen: string, move: string | null): MoveVocabEntry | null {
  if (!move) return null;
  try {
    return entry(new Chess(fen).move(move));
  } catch {
    return null;
  }
}

/** Replay a line (SAN or UCI) from a position into vocab entries, stopping at the first misfit. */
function replay(fen: string, moves: string[]): MoveVocabEntry[] {
  const game = new Chess(fen);
  const out: MoveVocabEntry[] = [];
  for (const m of moves) {
    try {
      out.push(entry(game.move(m)));
    } catch {
      break;
    }
  }
  return out;
}

/** The full set of moves the coach is permitted to name, deduped by UCI (played first, then best/PV). */
export function vocabulary(p: CoachPayload): MoveVocabEntry[] {
  const seen = new Set<string>();
  const out: MoveVocabEntry[] = [];
  for (const e of [p.played, p.best, ...p.pv]) {
    if (e && !seen.has(e.uci)) {
      seen.add(e.uci);
      out.push(e);
    }
  }
  return out;
}

/** Build a forward-looking hint payload for the current position the player faces. */
export function buildHintPayload(opts: {
  fen: string;
  positionEval: PositionEval | null;
  history: string[];
  playerColor: "w" | "b";
  tier: HintTier;
}): CoachPayload {
  const { fen, positionEval, history, playerColor, tier } = opts;
  const pv = positionEval ? replay(fen, positionEval.pvUci) : [];
  const best = pv[0] ?? single(fen, positionEval?.bestUci ?? null);
  return {
    surface: "hint",
    tier,
    fen,
    toMove: sideToMove(fen),
    playerColor,
    moveNumber: Math.floor(history.length / 2) + 1,
    evalText: positionEval ? formatEval(positionEval.eval) : "—",
    assessment: assess(positionEval?.eval ?? null, playerColor),
    best,
    pv,
    pvUci: positionEval?.pvUci ?? [],
    played: null,
    quality: null,
    qualityLabel: null,
    evalAfterText: null,
    winDrop: null,
    sanTail: history.slice(-SAN_TAIL),
  };
}

/** Build a backward-looking explanation payload for a move already played. */
export function buildExplainPayload(opts: {
  fact: MoveFact;
  history: string[];
  playerColor: "w" | "b";
}): CoachPayload {
  const { fact, history, playerColor } = opts;
  const pv = replay(fact.fenBefore, fact.pvSan);
  const best = pv[0] ?? single(fact.fenBefore, fact.bestUci);
  const cls: Classification | null = fact.classification;
  return {
    surface: "explain",
    tier: null,
    fen: fact.fenBefore,
    toMove: fact.color,
    playerColor,
    moveNumber: fact.moveNumber,
    evalText: fact.evalBefore ? formatEval(fact.evalBefore) : "—",
    assessment: assess(fact.evalBefore, playerColor),
    best,
    pv,
    pvUci: pv.map((e) => e.uci),
    played: single(fact.fenBefore, fact.san),
    quality: fact.quality,
    qualityLabel: fact.quality ? QUALITY_META[fact.quality].label : null,
    evalAfterText: fact.evalAfter ? formatEval(fact.evalAfter) : null,
    winDrop: cls ? Math.round(cls.winDrop) : null,
    sanTail: history.slice(Math.max(0, fact.ply - SAN_TAIL), fact.ply),
  };
}

/** Re-export for callers that only need the eval-formatting + types here. */
export type { Eval };
