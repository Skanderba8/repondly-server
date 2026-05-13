import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['admin.repondly.com', 'localhost:3006'],

  // ─── Production performance optimizations ───────────────────────────
  // Disable source maps in production to reduce memory usage
  productionBrowserSourceMaps: false,

  // Disable powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,
};

export default nextConfig;