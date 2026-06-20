/**
 * The coaching provider — the one place that talks to Claude.
 *
 * Server-only. Everything Claude-specific is sealed behind `streamCoaching` /
 * `generateCoaching` so the rest of the app speaks "give me coaching for this payload" and
 * never imports the Anthropic SDK. Swapping models (or providers) is the single `COACH_MODEL`
 * constant. Also exports `coachFallback`: a deterministic, engine-grounded explanation used
 * when the key is missing, the API errors, or (rarely) the validator rejects a generated move
 * — so the product never has to show nothing, and never shows an ungrounded move.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { type CoachPayload } from "@/lib/coach/payload";
import { COACH_SYSTEM_PROMPT, buildUserMessage } from "@/lib/coach/prompt";

/** One-line swap point: Opus 4.8 is the make-or-break teaching layer; drop to
 *  "claude-sonnet-4-6" here if cost ever bites (see M3 grilling notes). */
export const COACH_MODEL = "claude-opus-4-8";

/** Short blurbs only — one lesson, a few sentences. */
const MAX_TOKENS = 700;

let client: Anthropic | null = null;

/** Whether a server-side Anthropic key is present. The route degrades to the fallback if not. */
export function isCoachConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

/** Hints should feel instant; explanations can afford a touch more deliberation. */
function effortFor(payload: CoachPayload): "low" | "medium" {
  return payload.surface === "hint" ? "low" : "medium";
}

function requestParams(payload: CoachPayload) {
  return {
    model: COACH_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      { type: "text" as const, text: COACH_SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } },
    ],
    thinking: { type: "adaptive" as const },
    output_config: { effort: effortFor(payload) },
    messages: [{ role: "user" as const, content: buildUserMessage(payload) }],
  };
}

/** Stream the coach's reply as plain-text deltas. */
export async function* streamCoaching(
  payload: CoachPayload,
  opts: { signal?: AbortSignal } = {},
): AsyncGenerator<string> {
  const stream = getClient().messages.stream(requestParams(payload), { signal: opts.signal });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

/** Non-streamed generation — used for the rare regenerate pass after a validation miss. */
export async function generateCoaching(payload: CoachPayload): Promise<string> {
  const msg = await getClient().messages.create(requestParams(payload));
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/**
 * Deterministic, fully-grounded coaching built only from engine facts — no LLM. The route's
 * safety net: shown when Claude is unavailable, errors, or names a move the validator rejects.
 */
export function coachFallback(payload: CoachPayload): string {
  const bestPhrase = payload.best ? `${payload.best.gloss} (${payload.best.san})` : null;
  const now = payload.assessment ? `Right now, ${payload.assessment}.` : "";

  if (payload.surface === "explain") {
    const move = payload.played ? `${payload.played.gloss} (${payload.played.san})` : "that move";
    const isError =
      payload.quality === "blunder" || payload.quality === "mistake" || payload.quality === "inaccuracy";
    if (isError && bestPhrase) {
      const cost =
        payload.winDrop != null && payload.winDrop >= 1
          ? ` (about ${payload.winDrop}% of the winning chances)`
          : "";
      return `Playing ${move} gave something back${cost}. The engine preferred ${bestPhrase} — worth keeping an eye on next time.`;
    }
    if (bestPhrase) {
      return `${capitalize(move)} holds up fine. The engine's top pick was ${bestPhrase}, if you want to compare.`;
    }
    return `${capitalize(move)} is on the board. ${now}`.trim();
  }

  switch (payload.tier) {
    case "nudge":
      return `Take a breath and scan the whole board — what is your opponent threatening, and which of your pieces is doing the least? ${now}`.trim();
    case "concept":
      return `Look for the most forcing, active option here rather than a quiet move; ask what each piece could be doing better. ${now}`.trim();
    case "candidate":
      return bestPhrase
        ? `The move to calculate first is ${bestPhrase}.`
        : "No engine suggestion is available for this position right now.";
    case "line":
      if (payload.pv.length > 0) {
        return `The engine's line runs ${payload.pv.map((m) => m.san).join(" ")}, starting with ${bestPhrase ?? "the first move shown"}.`;
      }
      return bestPhrase ? `The engine starts with ${bestPhrase}.` : "No engine line is available right now.";
    default:
      return now || "Have a look at the position and pick the most active plan.";
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
