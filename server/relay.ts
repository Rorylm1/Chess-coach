import { createRelay } from "../src/lib/realtime/server";

const origins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",").map((origin) => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS) {
  throw new Error("Set ALLOWED_ORIGINS to the exact HTTPS app origins before starting the relay.");
}
const port = Number(process.env.PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
const relay = createRelay({ origins, trustProxy: process.env.TRUST_PROXY === "1" });
relay.server.listen(port, process.env.HOST ?? "127.0.0.1", () => console.log(`Chess relay listening on port ${port}`));
for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => {
  void relay.close().then(() => process.exit(0));
});
