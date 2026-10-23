import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents fica desligado: quase toda página lê a sessão (cookies) do Supabase.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
