import { describe, expect, it } from "vitest";
import { mulberry32 } from "../board/rng";
import { legibilityOf } from "./backstop";
import { createRecipe, parseRecent, PIECE_DIRECTIONS, type RecentTable } from "./brief";
import { fallbackTable } from "./fallback";
import { PIECE_SETS } from "./pieceSets";
import { PIECE_STYLES, pieceRender, type PieceStyle, type TableSpec } from "./spec";

const recentWorld = (pieceStyle: PieceStyle): RecentTable => ({
  name: "Deep Space", pieceStyle, bg: "#0a0e14", boardLight: "#5c7382",
  boardDark: "#1b2733", frame: "glow", fontDisplay: "Chakra Petch",
});

function summarize(world: TableSpec): RecentTable {
  const { name, pieceStyle, bg, boardLight, boardDark, frame, fontDisplay, brief } = world;
  return { name, pieceStyle, bg, boardLight, boardDark, frame, fontDisplay, brief };
}

function narrativeParts(brief: string): string[] {
  const match = /^(.*), made from (.*); (.*)\.$/.exec(brief);
  expect(match, "a complete setting, material and twist").not.toBeNull();
  return match!.slice(1);
}

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function ratio(a: string, b: string): number {
  const left = luminance(a), right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

describe("randomizer variety", () => {
  it("starts without history across the full imaginative silhouette catalog", () => {
    const seen = new Set<string>();
    const samples = Object.keys(PIECE_SETS).length * 16;
    for (let i = 0; i < samples; i++) seen.add(pieceRender(createRecipe([], () => i / samples).pieceStyle).set);
    const imaginative = Object.keys(PIECE_SETS).filter((family) => !["cburnett", "chessnut", "letter"].includes(family));
    expect([...seen].sort()).toEqual(imaginative.sort());
  });

  it("provides a usable art direction for every registered silhouette family", () => {
    expect(Object.keys(PIECE_DIRECTIONS).sort()).toEqual(Object.keys(PIECE_SETS).sort());
    for (const [family, direction] of Object.entries(PIECE_DIRECTIONS)) {
      expect(direction.styles.length, family).toBeGreaterThan(0);
      for (const style of direction.styles) expect(pieceRender(style).set).toBe(family);
    }
  });

  it.each(PIECE_STYLES)("excludes the actual family of %s, including its style aliases", (style) => {
    const previous = recentWorld(style);
    for (let i = 0; i < 100; i++) {
      const recipe = createRecipe([previous], () => i / 100);
      expect(pieceRender(recipe.pieceStyle).set).not.toBe(pieceRender(style).set);
      expect(recipe.frame).not.toBe(previous.frame);
    }
  });

  it("excludes all five recent families and releases a family once it is older", () => {
    // Select distinct real families, so adding aliases or sets cannot weaken this test.
    const representatives = new Map(PIECE_STYLES.map((style) => [pieceRender(style).set, style]));
    const recent = [...representatives.values()].slice(0, 6).map(recentWorld);
    expect(recent).toHaveLength(6);
    const excluded = new Set(recent.slice(0, 5).map((world) => pieceRender(world.pieceStyle).set));
    const seen = new Set<string>();
    const samples = Object.keys(PIECE_SETS).length * 16;
    for (let i = 0; i < samples; i++) seen.add(pieceRender(createRecipe(recent, () => i / samples).pieceStyle).set);
    expect([...seen].sort()).toEqual([...representatives.keys()].filter((family) => !excluded.has(family)).sort());
    expect(seen.has(pieceRender(recent[5].pieceStyle).set)).toBe(true);
  });

  it("keeps changing silhouettes, narratives, palettes, type, names and value key through repeated offline rolls", () => {
    const random = mulberry32(271828);
    let recent: RecentTable[] = [recentWorld("classic-staunton")];
    const families = new Set<string>();
    for (let roll = 0; roll < Object.keys(PIECE_SETS).length * 20; roll++) {
      const recipe = createRecipe(recent, random);
      const next = fallbackTable(recent, recipe, random);
      const family = pieceRender(next.pieceStyle).set;
      expect(family).toBe(pieceRender(recipe.pieceStyle).set);
      expect(recent.map((world) => pieceRender(world.pieceStyle).set)).not.toContain(family);
      expect(recent.map((world) => world.name)).not.toContain(next.name);
      expect(recent.map((world) => world.fontDisplay)).not.toContain(next.fontDisplay);
      for (const part of narrativeParts(next.brief!)) {
        for (const previous of recent) {
          expect(previous.brief?.toLowerCase() ?? "", `roll ${roll} repeated ${part}`).not.toContain(part.toLowerCase());
        }
      }
      expect(next.frame).not.toBe(recent[0].frame);
      expect(next.bg).not.toBe(recent[0].bg);
      expect(next.boardDark).not.toBe(recent[0].boardDark);
      expect(luminance(next.bg) > 0.5).not.toBe(luminance(recent[0].bg) > 0.5);
      expect(legibilityOf(next).pass, `roll ${roll}: ${next.name}`).toBe(true);
      expect(ratio(next.pieceWhite, next.pieceBlack)).toBeGreaterThanOrEqual(2);
      expect(luminance(next.pieceWhite)).toBeGreaterThan(luminance(next.pieceBlack));
      expect(ratio(next.coordOnLight, next.boardLight)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(next.coordOnDark, next.boardDark)).toBeGreaterThanOrEqual(4.5);
      for (const ink of [next.ink, next.inkSoft, next.inkFaint]) {
        for (const surface of [next.bg, next.panel, next.panel2, next.surface]) {
          expect(ratio(ink, surface), `roll ${roll}: ${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      families.add(family);
      recent = [summarize(next), ...recent].slice(0, 5);
    }
    expect([...families].sort()).toEqual(Object.keys(PIECE_SETS).sort());
  });

  it("recognizes previous narrative choices after history sanitization, regardless of case", () => {
    const first = createRecipe([], () => 0);
    const recent = parseRecent([{ ...recentWorld(first.pieceStyle), brief: first.brief.toUpperCase() }]);
    const next = createRecipe(recent, () => 0);
    const originalParts = narrativeParts(first.brief);
    narrativeParts(next.brief).forEach((part, index) => expect(part).not.toBe(originalParts[index]));
  });

  it("still returns complete narrative choices if hostile history mentions every available option", () => {
    // Discover the option vocabulary through ordinary recipes; no duplicated preset list.
    const options = [new Set<string>(), new Set<string>(), new Set<string>()];
    for (let i = 0; i < 240; i++) {
      narrativeParts(createRecipe([], () => i / 240).brief).forEach((part, index) => options[index].add(part));
    }
    const hostile = options.flatMap((parts) => [...parts]).join("; ");
    const recent = [{ ...recentWorld("classic-staunton"), brief: hostile }];
    for (const random of [() => 0, () => 0.5, () => 0.999]) {
      const next = createRecipe(recent, random);
      const parts = narrativeParts(next.brief);
      expect(next.brief).not.toContain("undefined");
      parts.forEach((part, index) => expect(options[index].has(part)).toBe(true));
      expect(pieceRender(next.pieceStyle).set).not.toBe("cburnett");
    }
  });
});

describe("recent world input", () => {
  it.each([undefined, null, "[]", 12, {}, { recent: [] }])("ignores a non-array history: %j", (value) => {
    expect(parseRecent(value)).toEqual([]);
  });

  it("rejects invalid entries and bounds accepted history to the newest five slots", () => {
    expect(parseRecent([null, false, "orbital", {}, { pieceStyle: "unknown" }])).toEqual([]);
    const valid = Array.from({ length: 20 }, (_, i) => ({ ...recentWorld("orbital"), name: `World ${i}` }));
    expect(parseRecent(valid).map((world) => world.name)).toEqual(["World 0", "World 1", "World 2", "World 3", "World 4"]);
  });

  it("keeps only compact descriptive fields and sanitizes labels, colors and frames", () => {
    const [parsed] = parseRecent([{
      pieceStyle: "orbital", name: `<script>bad</script>\n${"x".repeat(100)}`,
      fontDisplay: 'Nice Font";\n{}', bg: "url(https://example.com)", boardLight: "#abc", boardDark: "#AAbbCC",
      frame: "unbounded", secret: "never carry arbitrary fields", extra: { instruction: "ignored" },
    }]);
    expect(parsed).toEqual({
      pieceStyle: "orbital", name: `scriptbadscript${"x".repeat(49)}`, fontDisplay: "Nice Font",
      bg: "#808080", boardLight: "#808080", boardDark: "#AAbbCC", frame: "plain",
    });
  });

  it("preserves useful brief punctuation while stripping markup and bounding it to 400 characters", () => {
    const brief = "A moon's toy-shop, made from paper; gravity is sideways.";
    expect(parseRecent([{ ...recentWorld("orbital"), brief }])[0].brief).toBe(brief);
    const [parsed] = parseRecent([{ ...recentWorld("orbital"), brief: `<b>${brief}</b>\n\t{}${"x".repeat(500)}` }]);
    expect(parsed.brief).toHaveLength(400);
    expect(parsed.brief).not.toMatch(/[<>/\n\t{}]/);
    expect(parsed.brief).toContain(brief);
    expect(parseRecent([{ ...recentWorld("orbital"), brief: { instruction: "ignore" } }])[0]).not.toHaveProperty("brief");
  });
});
