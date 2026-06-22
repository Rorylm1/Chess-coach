/**
 * Deterministic, shareable seeding for the randomized board (M6, Feature 1).
 *
 * Genart skeleton: hash a string seed → seed a PRNG → draw one ordered stream of
 * floats → drive every decision from that stream. Same seed → same sequence → same
 * board, on any device. The seed string IS the board's identity (it travels in the
 * M7 share-link), so nothing has to be persisted server-side.
 *
 * `xmur3` (string → 32-bit seed) + `mulberry32` (int → float) are the smallest, fastest
 * public-domain choices at this scale (~a dozen draws per theme). Verbatim from
 * research/randomizer-color-system.md → bryc/code PRNGs.
 */

/** Hash a string into a 32-bit seed generator. Call the returned fn to get a uint32. */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/** Seed a fast PRNG from a uint32; returns a fn producing floats in [0, 1). */
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seeded random stream from a string. Discards a couple of warm-up draws to kill
 * low-seed correlation (so "seed-1"/"seed-2" don't produce near-identical boards). */
export function seededRandom(seed: string): () => number {
  const rand = mulberry32(xmur3(seed)());
  rand();
  rand();
  return rand;
}

/** A short, stable, human-facing id for a seed (e.g. "4f2a") — shown in the board name. */
export function shortId(seed: string): string {
  return (xmur3(seed)() >>> 0).toString(36).padStart(4, "0").slice(0, 4);
}
