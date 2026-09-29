/** Server-only Claude art direction for the board randomizer. */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { backstop } from "./backstop";
import { createRecipe, buildTableUserPrompt, TABLE_SYSTEM_PROMPT, type RecentTable } from "./brief";
import type { TableSpec } from "./spec";
import { parseTable, TABLE_SCHEMA } from "./validate";
export { fallbackTable } from "./fallback";

export const TABLE_MODEL = "claude-opus-4-8";
export function isTableConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ timeout: 45_000, maxRetries: 0 });
  return client;
}


export async function generateTable(recent: RecentTable[] = [], recipe = createRecipe(recent)): Promise<TableSpec> {
  const msg = await getClient().messages.create({
    model: TABLE_MODEL, max_tokens: 2400, temperature: 1,
    system: TABLE_SYSTEM_PROMPT,
    tools: [{ name: "present_table", description: "Present the invented chess world.", input_schema: TABLE_SCHEMA as unknown as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: "present_table" },
    messages: [{ role: "user", content: buildTableUserPrompt(recipe, recent) }],
  });
  const block = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "present_table");
  if (!block || msg.stop_reason === "max_tokens") throw new Error("incomplete table response");
  return backstop({ ...parseTable(block.input), id: `gen-${crypto.randomUUID()}`, brief: recipe.brief,
    pieceStyle: recipe.pieceStyle, frame: recipe.frame });
}
