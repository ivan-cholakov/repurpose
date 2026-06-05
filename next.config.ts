import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server (.next/standalone) for the Docker image.
  output: "standalone",
  // Auto-memoize components/hooks; streaming token renders skip unchanged cards.
  reactCompiler: true,
  experimental: {
    // Tailwind keeps the CSS tiny, so inlining it removes the render-blocking
    // stylesheet request for first-time visitors (the landing page audience).
    inlineCss: true,
  },
};

export default nextConfig;
