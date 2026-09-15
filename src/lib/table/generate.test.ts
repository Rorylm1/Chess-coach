import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRecipe, type TableRecipe } from "./brief";
import { fallbackTable } from "./fallback";
import { legibilityOf } from "./backstop";

const sdk = vi.hoisted(() => {
  const create = vi.fn();
  const constructor = vi.fn(function () { return { messages: { create } }; });
  return { create, constructor };
});

vi.mock("server-only", () => ({}));
vi.mock("@anthropic-ai/sdk", () => ({ default: sdk.constructor }));

const recipe: TableRecipe = createRecipe([], () => 0.35);
const fixture = fallbackTable([], recipe, () => 0.4);
const response = (input: unknown) => ({
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id: "test-tool", name: "present_table", input }],
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("ANTHROPIC_API_KEY", "unit-test-secret-do-not-return");
  sdk.create.mockResolvedValue(response(fixture));
});
afterEach(() => vi.unstubAllEnvs());

describe("Claude board generation", () => {
  it("forces a complete structured tool response and bounds the provider request", async () => {
    const { generateTable, TABLE_MODEL } = await import("./generate");
    const { TABLE_SYSTEM_PROMPT, buildTableUserPrompt } = await import("./brief");
    await generateTable([], recipe);
    expect(sdk.constructor).toHaveBeenCalledWith(expect.objectContaining({ timeout: 45_000, maxRetries: 0 }));
    expect(sdk.create).toHaveBeenCalledOnce();
    const [request] = sdk.create.mock.calls[0];
    expect(request).toMatchObject({
      model: TABLE_MODEL, max_tokens: 2400, temperature: 1,
      system: TABLE_SYSTEM_PROMPT,
      tool_choice: { type: "tool", name: "present_table" },
      messages: [{ role: "user", content: buildTableUserPrompt(recipe, []) }],
    });
    expect(request.tools).toHaveLength(1);
    expect(request.tools[0]).toMatchObject({ name: "present_table", input_schema: { type: "object" } });
    expect(request.tools[0].input_schema.required).toEqual(expect.arrayContaining([
      "pieceStyle", "boardLight", "boardDark", "pieceWhite", "pieceBlack", "bgGradient", "fontDisplay",
    ]));
    expect(JSON.stringify(request)).not.toContain(process.env.ANTHROPIC_API_KEY);
  });

  it("enforces the assigned silhouette and frame despite model drift, and strips unexpected output", async () => {
    sdk.create.mockResolvedValue(response({
      ...fixture, pieceStyle: "classic-staunton", frame: "glow", apiKey: process.env.ANTHROPIC_API_KEY,
      pieceWhite: "#777777", pieceBlack: "#777777", boardLight: "#777777", boardDark: "#777777",
    }));
    const { generateTable } = await import("./generate");
    const world = await generateTable([], recipe);
    expect(world.pieceStyle).toBe(recipe.pieceStyle);
    expect(world.frame).toBe(recipe.frame);
    expect(world.id).toMatch(/^gen-/);
    expect(world.brief).toBe(recipe.brief);
    expect(world).not.toHaveProperty("apiKey");
    expect(JSON.stringify(world)).not.toContain(process.env.ANTHROPIC_API_KEY);
    expect(legibilityOf(world).pass).toBe(true);
  });

  it.each([
    { label: "missing tool", message: { stop_reason: "end_turn", content: [{ type: "text", text: "a design" }] } },
    { label: "wrong tool", message: { stop_reason: "tool_use", content: [{ type: "tool_use", name: "other", input: fixture }] } },
    { label: "truncated response", message: { ...response(fixture), stop_reason: "max_tokens" } },
  ])("rejects $label instead of treating it as a finished board", async ({ message }) => {
    sdk.create.mockResolvedValue(message);
    const { generateTable } = await import("./generate");
    await expect(generateTable([], recipe)).rejects.toThrow("incomplete table response");
  });

  it.each([
    { label: "null output", input: null },
    { label: "missing fields", input: {} },
    { label: "non-string flavor", input: { ...fixture, flavor: 7 } },
    { label: "unknown silhouette", input: { ...fixture, pieceStyle: "unknown" } },
    { label: "nonfinite radius", input: { ...fixture, radius: Infinity } },
    { label: "invalid color", input: { ...fixture, boardDark: "red" } },
    { label: "injected font", input: { ...fixture, fontDisplay: 'Font"; color: red' } },
    { label: "external background", input: { ...fixture, bgGradient: "url(https://example.com/pixel)" } },
    { label: "background CSS statements", input: { ...fixture, bgGradient: "linear-gradient(red, blue); display:none" } },
    { label: "invalid hairline", input: { ...fixture, hairline: "var(--secret)" } },
  ])("rejects $label before rendering", async ({ input }) => {
    sdk.create.mockResolvedValue(response(input));
    const { generateTable } = await import("./generate");
    await expect(generateTable([], recipe)).rejects.toThrow(/invalid/);
  });

  it("propagates provider failure so the route can label its fallback honestly", async () => {
    sdk.create.mockRejectedValue(new Error("provider unavailable"));
    const { generateTable } = await import("./generate");
    await expect(generateTable([], recipe)).rejects.toThrow("provider unavailable");
  });

  it("detects missing configuration without instantiating the provider", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { isTableConfigured } = await import("./generate");
    expect(isTableConfigured()).toBe(false);
    expect(sdk.constructor).not.toHaveBeenCalled();
  });
});
