import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "backup.1d65a27b26ba359c0c28ca89126b3636.r2.cloudflarestorage.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: [
      "backup.1d65a27b26ba359c0c28ca89126b3636.r2.cloudflarestorage.com",
    ],
  },
};

export default nextConfig;
