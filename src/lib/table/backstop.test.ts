import { describe, expect, it } from "vitest";
import { backstop, backstopBoard, backstopInk, legibilityOf } from "./backstop";
import type { TableSpec } from "./spec";

const BASE: TableSpec = {
  id: "test-world", name: "Moon Jelly", flavor: "Chess under a candy moon.",
  fontDisplay: "Bungee", fontBody: "Lora", fontMono: "Inconsolata",
  displayWeight: 700, displaySpacing: "0.01em", displayTransform: "none",
  corner: "round", frame: "glow", motion: "rise", radius: 12,
  bg: "#101030", bgGradient: "none", panel: "#191934", panel2: "#18182a", surface: "#202a44",
  hairline: "#606080", hairline2: "#505070",
  ink: "#ffffff", inkSoft: "#eeeeee", inkFaint: "#dddddd",
  accentInteractive: "#f5a0dc", accentInteractiveDim: "#cb8cbb",
  accentEval: "#cfe37c", accentEvalDim: "#bfd273",
  boardLight: "#ccbbdd", boardDark: "#334422",
  pieceWhite: "#ffffff", pieceWhiteRim: "#000000", pieceBlack: "#000000", pieceBlackRim: "#ffffff",
  boardAccent: "#f5a0dc", boardLast: "#cfe37c", coordOnLight: "#111111", coordOnDark: "#ffffff",
  pieceStyle: "classic-staunton",
};

// Compute contrast from output colors independently of the backstop's repair helpers.
function luminance(hex: string): number {
  const full = hex.length === 4 ? "#" + [...hex.slice(1)].map((channel) => channel.repeat(2)).join("") : hex;
  const channels = [1, 3, 5].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function ratio(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

describe("generated world text legibility", () => {
  it.each([
    { name: "candy daylight", bg: "#ffe977", panel: "#f8a8cc", panel2: "#b0e8ef", surface: "#bbef82", ink: "#eaba8a", inkSoft: "#ef83b5", inkFaint: "#adcf98" },
    { name: "deep-sea ultraviolet", bg: "#10136a", panel: "#482042", panel2: "#25355a", surface: "#154a43", ink: "#64506c", inkSoft: "#296e76", inkFaint: "#364577" },
    { name: "midday coral", bg: "#ef9b8a", panel: "#de867a", panel2: "#ffc5a1", surface: "#f4ab82", ink: "#fff1ee", inkSoft: "#e7c4b7", inkFaint: "#d2ad9f" },
  ])("repairs every text tier across all four surfaces in $name", (world) => {
    const original = { ...BASE, ...world };
    const repaired = backstopInk(original);
    for (const ink of [repaired.ink, repaired.inkSoft, repaired.inkFaint, repaired.accentInteractive, repaired.accentInteractiveDim, repaired.accentEval, repaired.accentEvalDim]) {
      for (const surface of [repaired.bg, repaired.panel, repaired.panel2, repaired.surface]) {
        expect(ratio(ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const field of ["bg", "panel", "panel2", "surface"] as const) expect(repaired[field]).toBe(original[field]);
  });

  it("keeps pale pink and lime labels readable in a bright AI-generated world", () => {
    const original = { ...BASE, bg: "#f2fadf", panel: "#f5f9e6", panel2: "#e5efce", surface: "#f9fbe9", accentInteractive: "#c32472", accentInteractiveDim: "#f2a8ca", accentEval: "#567813", accentEvalDim: "#badb78" };
    const repaired = backstopInk(original);
    for (const accent of [repaired.accentInteractive, repaired.accentInteractiveDim, repaired.accentEval, repaired.accentEvalDim]) {
      for (const surface of [repaired.bg, repaired.panel, repaired.panel2, repaired.surface]) {
        expect(ratio(accent, surface), `${accent} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(luminance(repaired.accentInteractiveDim)).toBeLessThan(luminance(original.accentInteractiveDim));
    // A tint/shade repair keeps the pink channel ordering instead of substituting gray.
    const pink = repaired.accentInteractiveDim;
    expect(parseInt(pink.slice(1, 3), 16)).toBeGreaterThan(parseInt(pink.slice(5, 7), 16));
    expect(parseInt(pink.slice(5, 7), 16)).toBeGreaterThan(parseInt(pink.slice(3, 5), 16));
    expect(backstopInk(repaired)).toEqual(repaired);
  });

  it("preserves vivid accents that already meet contrast", () => {
    const original = { ...BASE, accentInteractive: "#ff77dd", accentEval: "#d4ff00" };
    const repaired = backstopInk(original);
    expect(repaired.accentInteractive).toBe(original.accentInteractive);
    expect(repaired.accentEval).toBe(original.accentEval);
  });

  it("prioritizes the panel when a bright page and conflicting panels cannot share accessible ink", () => {
    const original = { ...BASE, bg: "#ffffff", panel: "#080808", panel2: "#777777", surface: "#eeeeee", ink: "#555555", inkSoft: "#444444", inkFaint: "#333333" };
    const repaired = backstopInk(original);
    for (const ink of [repaired.ink, repaired.inkSoft, repaired.inkFaint]) {
      expect(ratio(ink, repaired.panel)).toBeGreaterThanOrEqual(4.5);
      expect(Number.isFinite(ratio(ink, repaired.bg))).toBe(true);
    }
    expect(repaired.bg).toBe(original.bg);
    expect(repaired.panel2).toBe(original.panel2);
    expect(repaired.surface).toBe(original.surface);
  });

  it("preserves an already readable palette and leaves its input untouched", () => {
    const original = structuredClone(BASE);
    expect(backstop(BASE)).toEqual(original);
    expect(BASE).toEqual(original);
  });
});

describe("generated world board legibility", () => {
  it("keeps both armies distinct even when identical fills already contrast with the squares", () => {
    const repaired = backstopBoard({ ...BASE, pieceWhite: "#fcf4a2", pieceBlack: "#fcf4a2", pieceWhiteRim: "#000000", pieceBlackRim: "#000000" });
    expect(ratio(repaired.pieceWhite, repaired.pieceBlack)).toBeGreaterThanOrEqual(2);
    expect(luminance(repaired.pieceWhite)).toBeGreaterThan(luminance(repaired.pieceBlack));
  });

  it("repairs collapsed, reversed, and saturated boards with finite results", () => {
    const colors = ["#000000", "#ffffff", "#808080", "#ff0088", "#00ffff", "#ffff00", "#0000ff", "#119944"];
    for (const light of colors) {
      for (const dark of colors) {
        const original = { ...BASE, boardLight: light, boardDark: dark, pieceWhite: dark, pieceWhiteRim: dark, pieceBlack: light, pieceBlackRim: light, coordOnLight: light, coordOnDark: dark };
        const repaired = backstopBoard(original);
        expect(ratio(repaired.boardLight, repaired.boardDark)).toBeGreaterThanOrEqual(1.7);
        expect(ratio(repaired.pieceWhite, repaired.pieceBlack)).toBeGreaterThanOrEqual(2);
        expect(luminance(repaired.pieceWhite)).toBeGreaterThan(luminance(repaired.pieceBlack));
        for (const square of [repaired.boardLight, repaired.boardDark]) {
          for (const [fill, rim] of [[repaired.pieceWhite, repaired.pieceWhiteRim], [repaired.pieceBlack, repaired.pieceBlackRim]]) {
            expect(Math.max(ratio(fill, square), ratio(rim, square))).toBeGreaterThanOrEqual(3);
          }
        }
        expect(ratio(repaired.coordOnLight, repaired.boardLight)).toBeGreaterThanOrEqual(4.5);
        expect(ratio(repaired.coordOnDark, repaired.boardDark)).toBeGreaterThanOrEqual(4.5);
        const metrics = legibilityOf(repaired);
        expect(metrics.pass).toBe(true);
        expect(Number.isFinite(metrics.minPiece) && Number.isFinite(metrics.squares)).toBe(true);
        expect(backstopBoard(repaired)).toEqual(repaired);
      }
    }
  });

  it("does not report a passing board below the 1.7 square contrast floor", () => {
    const metrics = legibilityOf({ ...BASE, boardLight: "#aaaaaa", boardDark: "#888888" });
    expect(metrics.squares).toBeGreaterThan(1.45);
    expect(metrics.squares).toBeLessThan(1.7);
    expect(metrics.pass).toBe(false);
  });
});
