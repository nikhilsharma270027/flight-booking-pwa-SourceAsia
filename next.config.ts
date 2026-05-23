import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Configure for Turbopack (Next.js 16 default)
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disableDevLogs: true,
  publicExcludes: ["!robots.txt"],
  buildExcludes: ["middleware-manifest.json"],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\..*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/.+\.(js|css|woff2)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.+\.(png|svg|jpg|jpeg)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
})(nextConfig);
