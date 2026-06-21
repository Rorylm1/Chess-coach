/**
 * The opening catalog + authored-content registry (M5).
 *
 * `OPENINGS` maps slugs to the fully-authored `Opening` content; a journey page only
 * renders for slugs present here. `CATALOG` is the index-card list, derived from the
 * authored set (plus any not-yet-authored entries marked `available: false`). New
 * opening: add the content file, register it in `OPENINGS`, and add it to `CATALOG`.
 */

import type { Opening, Side } from "@/lib/openings/tree";
import { italianGame } from "@/content/openings/italian-game";
import { queensGambit } from "@/content/openings/queens-gambit";
import { sicilianDefense } from "@/content/openings/sicilian-defense";
import { frenchDefense } from "@/content/openings/french-defense";

/** Index-card metadata for a curated opening (content may or may not exist yet). */
export interface OpeningSummary {
  slug: string;
  name: string;
  eco: string;
  learnerSide: Side;
  blurb: string;
  /** Whether a full journey is authored and playable. */
  available: boolean;
}

/** Fully-authored journeys, by slug. */
export const OPENINGS: Record<string, Opening> = {
  [italianGame.slug]: italianGame,
  [queensGambit.slug]: queensGambit,
  [sicilianDefense.slug]: sicilianDefense,
  [frenchDefense.slug]: frenchDefense,
};

/** The full curated set, in display order. */
export const CATALOG: OpeningSummary[] = [
  italianGame,
  queensGambit,
  sicilianDefense,
  frenchDefense,
].map(summarize);

/** Look up an authored opening by slug. */
export function getOpening(slug: string): Opening | undefined {
  return OPENINGS[slug];
}

/** Distill a full opening into its index-card summary. */
function summarize(o: Opening): OpeningSummary {
  return {
    slug: o.slug,
    name: o.name,
    eco: o.eco,
    learnerSide: o.learnerSide,
    blurb: o.blurb,
    available: true,
  };
}
