import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['admin.repondly.com', 'localhost:3006'],

  // ─── Production performance optimizations ───────────────────────────
  // Enable source maps for debugging
  productionBrowserSourceMaps: true,

  // Disable powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,
};

export default nextConfig;