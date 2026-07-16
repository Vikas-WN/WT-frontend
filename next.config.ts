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
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_BASE_URL || "http://localhost:8080"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
