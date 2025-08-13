import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    'alith'
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
