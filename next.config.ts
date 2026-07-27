import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Turbopack is enabled via `pnpm dev` (`next dev --turbopack`).
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "@base-ui/react",
      "lucide-react",
      "date-fns",
    ],
    // Allow large multipart onboarding/profile uploads through the BFF proxy.
    proxyClientMaxBodySize: "50mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // API traffic is proxied at runtime by src/app/api/v1/[...path]/route.ts using API_BASE_URL.
  // Do not add /api/v1 rewrites here: build-time destinations bake localhost into Docker images.
};

export default nextConfig;
