/**
 * POST /api/coach — turn an engine-fact payload into one human lesson, streamed back as text.
 *
 * The anti-hallucination gate lives here. Grounding is already *structural* (the prompt only
 * lets Claude quote a closed move vocabulary), so this is the backstop: we generate, scan the
 * prose for any move it named, and validate each against `chess.js` + the supplied PV. If the
 * coach somehow names a move outside the allowed set — or an illegal one — we regenerate once,
 * and failing that fall back to a deterministic engine-only explanation. The product therefore
 * can never display a move the engine didn't actually offer.
 *
 * First ship is generate → validate → stream the *validated* text (word-chunked for a live
 * feel). Switching to true token-streaming later keeps this same text/plain delta contract.
 */

import { type CoachPayload } from "@/lib/coach/payload";
import { hasUngroundedMove } from "@/lib/coach/guard";
import { isCoachConfigured, generateCoaching, coachFallback } from "@/lib/coach/provider";

export const runtime = "nodejs"; // the Anthropic SDK + server-only need Node, not edge
export const maxDuration = 30;

async function resolveCoaching(payload: CoachPayload): Promise<string> {
  if (!isCoachConfigured()) return coachFallback(payload);
  try {
    let text = await generateCoaching(payload);
    if (hasUngroundedMove(text, payload)) {
      console.warn("[coach] generated an ungrounded move — regenerating");
      text = await generateCoaching(payload);
      if (hasUngroundedMove(text, payload)) {
        console.warn("[coach] regeneration still ungrounded — using deterministic fallback");
        return coachFallback(payload);
      }
    }
    return text || coachFallback(payload);
  } catch (err) {
    console.error("[coach] generation failed", err);
    return coachFallback(payload);
  }
}

function isValidPayload(p: unknown): p is CoachPayload {
  if (!p || typeof p !== "object") return false;
  const surface = (p as { surface?: unknown }).surface;
  const fen = (p as { fen?: unknown }).fen;
  return (surface === "hint" || surface === "explain") && typeof fen === "string";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!isValidPayload(payload)) {
    return new Response("Invalid coach payload", { status: 400 });
  }

  const text = await resolveCoaching(payload);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const chunk of text.split(/(\s+)/)) {
          controller.enqueue(encoder.encode(chunk));
          if (chunk.trim()) await sleep(14); // typewriter cadence; client disconnect ends it
        }
      } catch {
        // client went away mid-stream — nothing to do
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
