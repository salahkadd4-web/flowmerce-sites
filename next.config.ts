import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne pas annoncer le framework (`X-Powered-By: Next.js`).
  poweredByHeader: false,

  experimental: {
    // Deux layouts racines (espace vendeur, sites) : le 404 général passe par
    // app/global-not-found.tsx.
    globalNotFound: true,
  },
};

export default nextConfig;
