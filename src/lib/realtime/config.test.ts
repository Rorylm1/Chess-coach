import { describe, expect, it } from "vitest";
import { PRODUCTION_ORIGIN, PRODUCTION_RELAY, resolveRelayUrl } from "./config";

describe("online play configuration", () => {
  it("keeps production invites working when a deployment omits the environment override", () => {
    expect(resolveRelayUrl(undefined, new URL(PRODUCTION_ORIGIN))).toBe(PRODUCTION_RELAY);
    expect(resolveRelayUrl(" ", new URL(PRODUCTION_ORIGIN))).toBe(PRODUCTION_RELAY);
  });
  it("respects an explicit relay", () => {
    expect(resolveRelayUrl("wss://games.example/socket", new URL(PRODUCTION_ORIGIN))).toBe("wss://games.example/socket");
  });
  it("uses the development relay on either loopback hostname", () => {
    for (const host of ["localhost", "127.0.0.1"]) {
      expect(resolveRelayUrl(undefined, new URL(`http://${host}:3000`))).toBe(`ws://${host}:8787/socket`);
    }
  });
  it("does not silently connect unknown sites to the production service", () => {
    expect(() => resolveRelayUrl(undefined, new URL("https://other.vercel.app"))).toThrow("isn't available");
  });
  it("rejects insecure and non-WebSocket overrides on HTTPS", () => {
    for (const value of ["ws://games.example/socket", "https://games.example/socket"]) {
      expect(() => resolveRelayUrl(value, new URL(PRODUCTION_ORIGIN))).toThrow("secure");
    }
  });
});
