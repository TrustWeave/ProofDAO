import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['alith', '@lazai-labs/alith-darwin-arm64', '@lazai-labs/alith-linux-x64-gnu'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
