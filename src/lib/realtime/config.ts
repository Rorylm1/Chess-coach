/** This public endpoint is part of the production site, not a secret. */
export const PRODUCTION_ORIGIN = "https://chess-coach-nine-beta.vercel.app";
export const PRODUCTION_RELAY = "wss://chess.46-62-217-82.sslip.io/socket";

export function resolveRelayUrl(configured: string | undefined, site: Pick<Location, "origin" | "hostname" | "protocol">): string {
  if (configured?.trim()) {
    const url = new URL(configured.trim());
    if (!["ws:", "wss:"].includes(url.protocol) || (site.protocol === "https:" && url.protocol !== "wss:")) {
      throw new Error("Online play needs a secure game-service connection.");
    }
    return url.href;
  }
  // Keep the established site working when a build omits the optional override.
  // Unknown deployments must opt in; the relay also enforces its origin allowlist.
  if (site.origin === PRODUCTION_ORIGIN) return PRODUCTION_RELAY;
  if (["localhost", "127.0.0.1"].includes(site.hostname)) {
    return `${site.protocol === "https:" ? "wss" : "ws"}://${site.hostname}:8787/socket`;
  }
  throw new Error("Online play isn't available on this site yet. You can still play on one device.");
}
