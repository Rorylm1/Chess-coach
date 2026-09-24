import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRecipe, parseRecent, type RecentTable } from "@/lib/table/brief";
import { fallbackTable } from "@/lib/table/fallback";
import { PIECE_STYLES, pieceRender } from "@/lib/table/spec";

const provider = vi.hoisted(() => ({ generate: vi.fn(), configured: vi.fn() }));
vi.mock("@/lib/table/generate", async () => {
  const { fallbackTable } = await import("@/lib/table/fallback");
  return { generateTable: provider.generate, isTableConfigured: provider.configured, fallbackTable };
});

import { POST } from "./route";

const RECENT: RecentTable[] = ["orbital", "botanical", "origami", "pixel", "neon-outline"].map((pieceStyle, index) => ({
  name: `World ${index}`, pieceStyle: pieceStyle as RecentTable["pieceStyle"], bg: "#112233",
  boardLight: "#aabbcc", boardDark: "#223344", frame: "glow", fontDisplay: "Bungee",
}));

const request = (value: unknown) => new Request("http://localhost/api/table", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
});

beforeEach(() => {
  vi.clearAllMocks();
  provider.configured.mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/table", () => {
  it("honors recent silhouettes and labels a missing-key fallback", async () => {
    provider.configured.mockReturnValue(false);
    const result = await POST(request({ recent: RECENT }));
    const world = await result.json();
    expect(result.status).toBe(200);
    expect(world.fallback).toBe(true);
    expect(RECENT.map((previous) => pieceRender(previous.pieceStyle).set)).not.toContain(pieceRender(world.pieceStyle).set);
    expect(world.frame).not.toBe(RECENT[0].frame);
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it("passes bounded descriptive history and the assigned recipe to the provider", async () => {
    const fixture = fallbackTable([], createRecipe([], () => 0.2), () => 0.2);
    provider.generate.mockResolvedValue(fixture);
    const supplied = [...RECENT, { ...RECENT[0], name: "Too old" }].map((world) => ({ ...world, unexpected: "ignore me" }));
    const result = await POST(request({ recent: supplied }));
    expect(provider.generate).toHaveBeenCalledOnce();
    const [recent, recipe] = provider.generate.mock.calls[0];
    expect(recent).toEqual(parseRecent(supplied));
    expect(recent).toHaveLength(5);
    expect(RECENT.map((previous) => pieceRender(previous.pieceStyle).set)).not.toContain(pieceRender(recipe.pieceStyle).set);
    expect(await result.json()).toEqual(fixture);
  });

  it("keeps the assigned recipe when generation fails and exposes the fallback flag", async () => {
    provider.generate.mockRejectedValue(new Error("Provider unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await POST(request({ recent: RECENT }));
    const world = await result.json();
    const [, recipe] = provider.generate.mock.calls[0];
    expect(result.status).toBe(200);
    expect(world.fallback).toBe(true);
    expect(world.pieceStyle).toBe(recipe.pieceStyle);
    expect(world.frame).toBe(recipe.frame);
    expect(world.brief).toBe(recipe.brief);
    expect(world).not.toHaveProperty("error");
  });

  it.each([undefined, "{not json"])("keeps legacy empty or malformed requests usable: %j", async (body) => {
    provider.configured.mockReturnValue(false);
    const result = await POST(new Request("http://localhost/api/table", { method: "POST", body }));
    const world = await result.json();
    expect(result.status).toBe(200);
    expect(world.fallback).toBe(true);
    expect(PIECE_STYLES.map((style) => pieceRender(style).set)).toContain(pieceRender(world.pieceStyle).set);
  });
});
