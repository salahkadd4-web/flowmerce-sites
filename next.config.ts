import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne pas annoncer le framework (`X-Powered-By: Next.js`).
  poweredByHeader: false,

  images: {
    // Images des vendeurs (/media/<clé>), photos des modèles (/templates/…) et logos
    // de l'espace vendeur. Chemins relatifs : optimisés sur n'importe quel hôte, sans IP locale.
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/templates/**" }, { pathname: "/logos/**" }],
  },

  experimental: {
    // Deux layouts racines (espace vendeur, sites) : le 404 général passe par
    // app/global-not-found.tsx.
    globalNotFound: true,
  },
};

export default nextConfig;
