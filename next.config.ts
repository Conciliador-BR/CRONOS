import os from "node:os";
import type { NextConfig } from "next";

const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
/** IPs privados desta máquina; só eles (não faixas inteiras) podem carregar o `pnpm dev:lan`. */
const lanIps = Object.values(os.networkInterfaces())
  .flat()
  .flatMap((net) => (net && net.family === "IPv4" && !net.internal && PRIVATE_IPV4.test(net.address) ? [net.address] : []));

const nextConfig: NextConfig = {
  // Só vale no `next dev`.
  allowedDevOrigins: lanIps,
  poweredByHeader: false,
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
    remotePatterns: [new URL("https://ctrnutyicmuhnehauqcb.supabase.co/storage/v1/object/sign/**")],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    // Maior upload por action: imagem de cartão (10 MB). O corpo é lido antes da checagem de sessão.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
