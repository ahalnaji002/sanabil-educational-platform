import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5001", pathname: "/uploads/**" },
      { protocol: "https", hostname: "api.sanabil-platform.space", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
