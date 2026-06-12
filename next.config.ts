import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack ignores the parent
  // repo's lockfile (Chess Coach lives inside an unrelated git working tree).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
