import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Silences optional-dependency warnings from WalletConnect packages
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;