import { describe, it, expect } from "vitest";
import {
  generateBoardTheme,
  themeForSeed,
  CLASSIC_THEME,
  randomBoardSeed,
} from "./theme";
import { xmur3, mulberry32, shortId } from "./rng";

// A spread of seeds, including adversarial ones (low ints, empties, unicode, long).
const SEEDS = (() => {
  const out: string[] = [];
  for (let i = 0; i < 600; i++) out.push(`seed-${i}-${i * 131 + 7}`);
  for (let i = 0; i < 50; i++) out.push(String(i)); // low-correlation risk
  out.push("a", "z", "opening-night", "♞", "the quick brown fox jumps", "0", "00", "classic-ish");
  return out;
})();

const parseOklchLC = (cssStr: string): { l: number; c: number } | null => {
  const m = cssStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+/);
  return m ? { l: parseFloat(m[1]), c: parseFloat(m[2]) } : null;
};

describe("board RNG", () => {
  it("xmur3 + mulberry32 are deterministic", () => {
    const a = mulberry32(xmur3("hello")());
    const b = mulberry32(xmur3("hello")());
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("shortId is stable and 4 chars", () => {
    expect(shortId("walnut")).toBe(shortId("walnut"));
    expect(shortId("walnut")).toHaveLength(4);
    expect(shortId("a")).not.toBe(shortId("b"));
  });
});

describe("generateBoardTheme — the legibility guarantee", () => {
  it("EVERY roll passes both floors (piece ≥ 3:1 vs both squares, square ΔL ≥ 0.28)", () => {
    const failures: string[] = [];
    for (const seed of SEEDS) {
      const th = generateBoardTheme(seed);
      if (!th.metrics.pass || th.metrics.minPieceContrast < 3 || th.metrics.squareDeltaL < 0.28) {
        failures.push(`${seed}: contrast ${th.metrics.minPieceContrast.toFixed(2)}, ΔL ${th.metrics.squareDeltaL.toFixed(2)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("never emits an accent in the mud-zone (L .40–.60 ∧ C .05–.12)", () => {
    for (const seed of SEEDS) {
      const accent = parseOklchLC(generateBoardTheme(seed).vars["--board-accent"]);
      expect(accent).not.toBeNull();
      const inMud = accent!.l >= 0.4 && accent!.l <= 0.6 && accent!.c >= 0.05 && accent!.c <= 0.12;
      expect(inMud, `accent ${JSON.stringify(accent)} for "${seed}"`).toBe(false);
    }
  });

  it("keeps board squares low-chroma (large fills must not be vivid)", () => {
    for (const seed of SEEDS) {
      const th = generateBoardTheme(seed);
      expect(parseOklchLC(th.vars["--sq-light"])!.c).toBeLessThanOrEqual(0.09);
      expect(parseOklchLC(th.vars["--sq-dark"])!.c).toBeLessThanOrEqual(0.1);
    }
  });
});

describe("determinism & shareability", () => {
  it("same seed → identical theme (the share-link contract)", () => {
    expect(generateBoardTheme("opening-night")).toEqual(generateBoardTheme("opening-night"));
  });

  it("different seeds generally differ", () => {
    expect(generateBoardTheme("a").vars).not.toEqual(generateBoardTheme("b").vars);
  });

  it("emits oklch() CSS for every variable on a roll", () => {
    const vars = generateBoardTheme("opening-night").vars;
    for (const v of Object.values(vars)) expect(v.startsWith("oklch(")).toBe(true);
  });

  it("covers all six families across the seed space", () => {
    const fams = new Set(SEEDS.map((s) => generateBoardTheme(s).family));
    expect(fams.size).toBe(6);
  });
});

describe("themeForSeed + classic default", () => {
  it("falsy or 'classic' resolves to the Deep-Space default", () => {
    expect(themeForSeed(null)).toBe(CLASSIC_THEME);
    expect(themeForSeed("")).toBe(CLASSIC_THEME);
    expect(themeForSeed("classic")).toBe(CLASSIC_THEME);
    expect(CLASSIC_THEME.isClassic).toBe(true);
    expect(CLASSIC_THEME.vars["--sq-light"]).toBe("#5c7382");
  });

  it("a real seed resolves to a generated, non-classic theme", () => {
    const th = themeForSeed("opening-night");
    expect(th.isClassic).toBe(false);
    expect(th.name).toMatch(/ · /);
  });

  it("randomBoardSeed produces a usable, distinct seed", () => {
    const a = randomBoardSeed();
    expect(a).toMatch(/^[a-z0-9]+$/);
    expect(generateBoardTheme(a).metrics.pass).toBe(true);
  });
});
