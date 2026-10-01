// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disables Next.js's built-in scroll restoration so that
    // back-navigation doesn't jump you down the page and skip
    // your DiaTextReveal / whileInView animations.
    scrollRestoration: false,
  },
};

export default nextConfig;