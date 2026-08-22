import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob storage
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      // Cloudflare R2 (if used)
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      // Common CDN/storage providers
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Base44 CDN (for reference images from old prompt)
      {
        protocol: "https",
        hostname: "**.base44.com",
      },
    ],
  },
  // Allow importing Three.js ESM module
  transpilePackages: ["three"],
};

export default nextConfig;
