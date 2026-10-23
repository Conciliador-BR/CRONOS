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
  images: {
    remotePatterns: [new URL("https://cnwflsucwedbmfltbeht.supabase.co/storage/v1/object/sign/**")],
  },
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
