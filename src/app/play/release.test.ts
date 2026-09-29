import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PlayPage from "./page";
import OnlinePage from "./[room]/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => { throw new Error("Not found"); },
}));

describe("multiplayer release contract", () => {
  it("renders an enabled create-invite button on the default Play page, alongside the randomizer", () => {
    const html = renderToStaticMarkup(createElement(PlayPage));
    const invite = html.match(/<button\b[^>]*>Create invite link<\/button>/)?.[0];
    expect(invite, "The invite must be visible without switching modes").toBeDefined();
    expect(invite).not.toContain("disabled");
    expect(html).toContain('aria-label="Board randomizer"');
  });
  it("ships the shareable room route and online game UI", async () => {
    const page = await OnlinePage({ params: Promise.resolve({ room: "a".repeat(24) }) });
    expect(renderToStaticMarkup(page)).toContain('aria-label="Online game panel"');
  });
  it("rejects invalid invite IDs", async () => {
    await expect(OnlinePage({ params: Promise.resolve({ room: "invalid" }) })).rejects.toThrow("Not found");
  });
});
