/**
 * POST /api/table — invent a fresh "generative table" design for the Play screen.
 *
 * Calls Claude to art-direct a complete visual world (server-side, key sealed in
 * `lib/table/generate`), runs the legibility backstop, and returns the validated TableSpec.
 * Degrades to a deterministic fallback world if the key is missing or the API errors — so
 * "Deal a table" always yields a fresh, legible look. Play-tab only; nothing is persisted.
 */

import { generateTable, fallbackTable, isTableConfigured } from "@/lib/table/generate";
import { createRecipe, parseRecent } from "@/lib/table/brief";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // Older clients sent an empty POST; keep those usable.
    body = null;
  }
  const recent = parseRecent(body && typeof body === "object" && "recent" in body ? body.recent : []);
  const recipe = createRecipe(recent);
  if (!isTableConfigured()) {
    return Response.json({ ...fallbackTable(recent, recipe), fallback: true });
  }
  try {
    const spec = await generateTable(recent, recipe);
    return Response.json(spec);
  } catch (err) {
    console.error("[/api/table] generation failed:", err instanceof Error ? err.message : "unknown error");
    return Response.json({ ...fallbackTable(recent, recipe), fallback: true });
  }
}
