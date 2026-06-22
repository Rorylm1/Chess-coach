import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Minimal vitest setup for the pure grounding-spine logic (classify, validate-move).
 *  These tests instantiate no Worker, so they run fast in the default node environment. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
