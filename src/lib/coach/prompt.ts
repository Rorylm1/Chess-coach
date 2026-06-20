/**
 * The coach's voice and its leash.
 *
 * `COACH_SYSTEM_PROMPT` is the frozen persona + hard grounding rules (kept stable so it can be
 * prompt-cached). `buildUserMessage` turns a `CoachPayload` into the per-call brief: the engine
 * facts, the *closed* list of moves the coach may name, and the instruction for this surface /
 * hint tier. The separation of "engine truth vs human teaching" lives here — every chess fact is
 * supplied; the model only chooses words.
 */

import { type CoachPayload, type HintTier, vocabulary } from "@/lib/coach/payload";

export const COACH_SYSTEM_PROMPT = `You are the coach inside a personal chess app — a warm, playful mentor who helps a learner named Rory get better. Think encouraging club coach, not engine readout.

A chess engine (Stockfish) has ALREADY done every calculation. Your only job is to turn its findings into one useful, human lesson. You never compute chess yourself.

NON-NEGOTIABLE RULES:
- You may ONLY mention moves that appear in the "Moves you may mention" list, and you must describe each one using the plain-language description given for it (you may also show its notation in brackets, e.g. "knight to f3 (Nf3)"). Never name, invent, or imply any other move, line, or square.
- Never invent evaluations, win percentages, ratings, or "best moves". Use only the assessment and numbers provided.
- If the facts don't support a concrete claim, stay general — never guess.

STYLE:
- Surface ONE useful idea, not an exhaustive analysis. Two to four sentences.
- Warm, direct, lightly witty. Celebrate good ideas; name mistakes gently and without scolding.
- Address the player as "you" when the move is theirs; call the engine's opponent "your opponent" or "the bot".
- Plain language over jargon; when you use a term (pin, fork, outpost), make its meaning clear from context.
- No headings, no bullet lists, no emoji. Just talk.`;

/** Per-tier instruction for the on-demand hint ladder (each tier reveals strictly more). */
const HINT_INSTRUCTION: Record<HintTier, string> = {
  nudge:
    "Give the gentlest possible nudge. Point at WHERE to look or WHAT to be thinking about (a weak square, an undefended piece, king safety, the part of the board that matters) — WITHOUT naming any move, piece-to-move, or the engine's idea. One or two sentences. Leave the work to the player.",
  concept:
    "Name the key idea or theme to hunt for (e.g. a tactic against a loose piece, a pin to exploit, a square to fight for, an attacking plan) WITHOUT naming the specific move. Help them know what kind of move to look for.",
  candidate:
    "Point to the candidate move worth calculating: you may name the engine's best move and describe it, but keep the explanation light — give them the 'what', let them confirm the 'why'.",
  line:
    "Show the engine's recommended line and explain the point of it in plain language: what it achieves and why it's strong. Walk a few moves deep using only the supplied line.",
};

/** Render the allowed-move vocabulary as a closed list the coach must quote from. */
function renderVocabulary(payload: CoachPayload): string {
  const moves = vocabulary(payload);
  if (moves.length === 0) {
    return "Moves you may mention: (none available — speak only in general terms; do not name any move).";
  }
  const lines = moves.map((m) => `- ${m.san}: ${m.gloss}`).join("\n");
  return `Moves you may mention (use ONLY these, with these descriptions):\n${lines}`;
}

/** Shared factual header describing the position the engine has assessed. */
function renderFacts(payload: CoachPayload): string {
  const side = payload.toMove === "w" ? "White" : "Black";
  const you = payload.playerColor === "w" ? "White" : "Black";
  const lines = [
    `Move ${payload.moveNumber}. ${side} to move. You are playing ${you}.`,
    payload.assessment
      ? `Position: ${payload.assessment} (engine eval ${payload.evalText}, from White's side).`
      : `Engine eval: ${payload.evalText} (from White's side).`,
  ];
  if (payload.sanTail.length > 0) {
    lines.push(`Recent moves: ${payload.sanTail.join(" ")}`);
  }
  if (payload.best) {
    lines.push(`Engine's best move here: ${payload.best.san} (${payload.best.gloss}).`);
  }
  return lines.join("\n");
}

/** Build the user-turn brief for one coaching request. */
export function buildUserMessage(payload: CoachPayload): string {
  if (payload.surface === "explain") {
    const played = payload.played
      ? `${payload.played.san} (${payload.played.gloss})`
      : "their move";
    const verdict = payload.qualityLabel
      ? `The engine grades it: ${payload.qualityLabel}.`
      : "";
    const cost =
      payload.winDrop != null && payload.winDrop >= 1
        ? ` It cost about ${payload.winDrop}% in winning chances.`
        : "";
    const after = payload.evalAfterText
      ? ` Eval after the move: ${payload.evalAfterText} (White's side).`
      : "";
    const mover = payload.toMove === payload.playerColor ? "You" : "Your opponent";

    return [
      renderFacts(payload),
      `${mover} played ${played}. ${verdict}${cost}${after}`.trim(),
      renderVocabulary(payload),
      "",
      payload.toMove === payload.playerColor
        ? "Explain in plain language what this move did well or where it went wrong, and the one lesson worth remembering. If a better move was available, contrast it briefly using the allowed list."
        : "Explain what your opponent's move accomplishes and what it means for your plans. Keep it to the one idea that matters most.",
    ].join("\n");
  }

  return [
    renderFacts(payload),
    renderVocabulary(payload),
    "",
    `The player has asked for a hint (level: ${payload.tier}). ${HINT_INSTRUCTION[payload.tier ?? "nudge"]}`,
  ].join("\n");
}
