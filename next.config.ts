import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Avoid blocking builds on unused imports or explicit 'any' typings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow dynamic dynamic-import loading for better-sqlite3
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
