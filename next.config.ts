import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne pas annoncer le framework (`X-Powered-By: Next.js`).
  poweredByHeader: false,
};

export default nextConfig;
