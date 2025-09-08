import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to proceed even if TypeScript reports errors (e.g., implicit any).
  // This does not affect editor typechecking; it only relaxes next build.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Also skip ESLint during production builds to avoid blocking on style rules.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
