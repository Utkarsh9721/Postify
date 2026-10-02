import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.mp4": { type: "asset" },
      "*.webm": { type: "asset" },
      "*.mov": { type: "asset" },
    },
  },
};

export default nextConfig;