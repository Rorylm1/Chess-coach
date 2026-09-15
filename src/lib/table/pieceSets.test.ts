import { describe, expect, it } from "vitest";
import { PIECE_SETS, type PieceType } from "./pieceSets";
import { PIECE_STYLES, pieceRender } from "./spec";

const ROLES: PieceType[] = ["K", "Q", "R", "B", "N", "P"];
const FAMILIES = Object.entries(PIECE_SETS);
const SCULPTURAL_FAMILIES = FAMILIES.filter(([family]) => !["cburnett", "chessnut", "letter"].includes(family));

function attributes(source: string): Array<[string, string]> {
  return [...source.matchAll(/\s([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1], match[2] ?? match[3]]);
}

/** Compare actual drawing instructions, ignoring paint, stroke weight and whitespace. */
function geometry(svg: string): string {
  const geometricAttributes = new Set(["d", "points", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "transform"]);
  return [...svg.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)].map((match) => {
    const values = attributes(match[2])
      .filter(([key]) => geometricAttributes.has(key))
      .map(([key, value]) => [key, value.match(/[a-zA-Z]+|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)?.join(" ") ?? ""])
      .sort(([a], [b]) => a.localeCompare(b));
    return [match[1], values];
  }).map((element) => JSON.stringify(element)).join("\n");
}

describe("piece family registry", () => {
  it("renders every advertised style through a real, complete family", () => {
    const reachable = new Set<string>();
    for (const style of PIECE_STYLES) {
      const family = pieceRender(style).set;
      const set = PIECE_SETS[family];
      expect(set, style).toBeDefined();
      expect(Object.keys(set.inner).sort(), style).toEqual([...ROLES].sort());
      for (const role of ROLES) expect(set.inner[role].trim().length, `${style} ${role}`).toBeGreaterThan(0);
      reachable.add(family);
    }
    expect([...reachable].sort()).toEqual(Object.keys(PIECE_SETS).sort());
  });

  it.each(FAMILIES)("%s provides usable viewBox dimensions and six distinct role drawings", (family, set) => {
    const box = set.vb.trim().split(/\s+/).map(Number);
    expect(box, family).toHaveLength(4);
    expect(box.every(Number.isFinite), family).toBe(true);
    expect(box[2], family).toBeGreaterThan(0);
    expect(box[3], family).toBeGreaterThan(0);
    expect(new Set(ROLES.map((role) => set.inner[role])).size, family).toBe(ROLES.length);
  });

  it.each(ROLES)("gives %s different geometry in every imaginative family", (role) => {
    const seen = new Map<string, string>();
    for (const [family, set] of SCULPTURAL_FAMILIES) {
      const shape = geometry(set.inner[role]);
      expect(shape.length, `${family} ${role}`).toBeGreaterThan(0);
      expect(seen.get(shape), `${family} ${role} duplicates ${seen.get(shape)}`).toBeUndefined();
      seen.set(shape, family);
    }
  });

  it.each(SCULPTURAL_FAMILIES)("%s keeps all chess roles geometrically distinct", (family, set) => {
    expect(new Set(ROLES.map((role) => geometry(set.inner[role]))).size, family).toBe(ROLES.length);
  });
});

describe("inline piece SVG contract", () => {
  it.each(FAMILIES)("%s uses recolorable, self-contained drawing markup", (family, set) => {
    const safeTags = new Set(["g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "tspan", "defs", "clipPath"]);
    const token = "var\\(--pc-(?:fill|rim)\\)";
    const amount = "(?:\\s+\\d+(?:\\.\\d+)?%)?";
    const themePaint = new RegExp(`^(?:none|currentColor|${token}|color-mix\\(in (?:srgb|oklab|oklch),\\s*${token}${amount},\\s*${token}${amount}\\))$`);
    for (const role of ROLES) {
      const svg = set.inner[role];
      const label = `${family} ${role}`;
      expect(svg, label).toContain("var(--pc-fill)");
      expect(svg, label).toContain("var(--pc-rim)");
      expect(svg, label).not.toMatch(/<!|<\?|javascript\s*:|data\s*:|@import|expression\s*\(/i);
      const stack: string[] = [];
      const references: string[] = [];
      const ids = new Set<string>();
      const tags = [...svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b([^>]*)>/g)];
      expect(tags.length, label).toBeGreaterThan(0);
      for (const tag of tags) {
        const [, closing, name, source] = tag;
        expect(safeTags.has(name), `${label}: ${name}`).toBe(true);
        if (closing) {
          expect(stack.pop(), `${label}: closing ${name}`).toBe(name);
          continue;
        }
        if (!source.trimEnd().endsWith("/")) stack.push(name);
        // Keep the checked attribute grammar the same as the browser-facing markup:
        // no unquoted assignments can evade the reference/event checks below.
        const unparsed = source.replace(/\s([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, "").replace(/\/\s*$/, "").trim();
        expect(unparsed, `${label}: invalid attribute syntax`).toBe("");
        for (const [key, value] of attributes(source)) {
          expect(key, label).not.toMatch(/^on/i);
          if (key === "id") ids.add(value);
          if (/^(?:xlink:)?href$|^src$/i.test(key)) {
            expect(value, label).toMatch(/^#[a-zA-Z_][\w:.-]*$/);
            references.push(value.slice(1));
          }
          for (const url of value.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) {
            expect(url[1], label).toMatch(/^#[a-zA-Z_][\w:.-]*$/);
            references.push(url[1].slice(1));
          }
          const paints = key === "fill" || key === "stroke" ? [value] : key === "style"
            ? [...value.matchAll(/(?:^|;)\s*(?:fill|stroke)\s*:\s*([^;]+)/g)].map((match) => match[1].trim()) : [];
          for (const paint of paints) expect(paint, label).toMatch(themePaint);
        }
      }
      expect(stack, `${label}: unclosed SVG elements`).toEqual([]);
      for (const reference of references) expect(ids.has(reference), `${label}: missing ${reference}`).toBe(true);
    }
  });
});
