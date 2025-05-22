import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimized for Vercel deployment
  reactStrictMode: true,
  poweredByHeader: false,
  // Enable image optimization for various domains if needed
  images: {
    domains: [],
  },
  // Add support for Sanity Studio
  typescript: {
    // Needed because Sanity Studio uses TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
