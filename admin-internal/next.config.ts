import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/admin",
  allowedDevOrigins: ['admin.repondly.com', 'localhost:3006'],
};

export default nextConfig;