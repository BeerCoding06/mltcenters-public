import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: "/millionaire",
  output: "standalone",
  // Pin tracing to this package so Docker standalone output is predictable
  // (.next/standalone/server.js) instead of nesting under a parent lockfile path.
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_BASE_PATH: "/millionaire",
  },
};

export default nextConfig;
