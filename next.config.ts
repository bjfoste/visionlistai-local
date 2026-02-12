import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://10.10.2.8:3001",
    "http://localhost:3001",
  ],
};

export default nextConfig;