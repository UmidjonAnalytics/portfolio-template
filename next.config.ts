import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=true builds plain files into ./out for Firebase Hosting (npm run release).
 * Without it the app builds normally, for Vercel or `next start`.
 */
const isExport = process.env.STATIC_EXPORT === "true";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: { root: import.meta.dirname },
  ...(isExport ? { output: "export" as const } : {}),
  images: {
    // A static export has no image optimiser; images are served as uploaded.
    unoptimized: isExport,
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Static exports cannot set headers; Firebase Hosting sets the same ones (scripts/release.mjs).
  ...(isExport ? {} : { headers: async () => [{ source: "/(.*)", headers: securityHeaders }] }),
};

export default nextConfig;
