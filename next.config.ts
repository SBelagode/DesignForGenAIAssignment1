import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server actions default to a 1 MB body; meme uploads are capped at 5 MB
    // (lib/memeImages.ts), plus multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
