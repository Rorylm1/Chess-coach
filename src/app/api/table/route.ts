/**
 * POST /api/table — invent a fresh "generative table" design for the Play screen.
 *
 * Calls Claude to art-direct a complete visual world (server-side, key sealed in
 * `lib/table/generate`), runs the legibility backstop, and returns the validated TableSpec.
 * Degrades to a deterministic fallback world if the key is missing or the API errors — so
 * "Deal a table" always yields a fresh, legible look. Play-tab only; nothing is persisted.
 */

import { generateTable, fallbackTable, isTableConfigured } from "@/lib/table/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  if (!isTableConfigured()) {
    return Response.json({ ...fallbackTable(), fallback: true });
  }
  try {
    const spec = await generateTable();
    return Response.json(spec);
  } catch (err) {
    console.error("[/api/table] generation failed:", err);
    return Response.json({ ...fallbackTable(), fallback: true });
  }
}
