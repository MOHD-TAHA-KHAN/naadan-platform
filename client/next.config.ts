import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@server"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
}

export default nextConfig
