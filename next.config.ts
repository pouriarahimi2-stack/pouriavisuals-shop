import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://rsms.me",
              "font-src 'self' data: https://fonts.gstatic.com https://rsms.me",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
              "frame-src 'self' https://trustseal.enamad.ir",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?!axoncore\\.ir$|localhost(:\\d+)?).*$",
          },
        ],
        destination: "https://axoncore.ir/:path*",
        permanent: true,
      },
      {
        source: "/track",
        destination: "/track-order",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
