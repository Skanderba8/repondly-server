import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  allowedDevOrigins: ['app.repondly.com', 'localhost:3004'],
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizeCss: false,
    serverMinification: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/:path*(.html)?',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      }
    ]
  }
};
export default nextConfig;
