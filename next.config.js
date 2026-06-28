import { withEve } from "eve/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api-gemini/:path*',
        destination: 'https://generativelanguage.googleapis.com/:path*',
      },
    ];
  },
};

export default withEve(nextConfig);
