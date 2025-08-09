import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['alith', '@lazai-labs/alith-darwin-arm64'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
