import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's root to this project directory.
  // Fixes: "Next.js inferred your workspace root, but it may not be correct"
  // caused by multiple package-lock.json files in parent directories.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
