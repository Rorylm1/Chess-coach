import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Loopback aliases let two isolated browser origins exercise multiplayer locally.
  allowedDevOrigins: ["127.0.0.1"],
  // Pin the workspace root to this project so Turbopack ignores the parent
  // repo's lockfile (Chess Coach lives inside an unrelated git working tree).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
