/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true, // رفع قطعی خطای 400 Bad Request برای تصاویر محلی و ریموت در ورسل
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
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://rsms.me",
              "font-src 'self' data: https://fonts.gstatic.com https://rsms.me",
              "img-src 'self' data: blob: https: http:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
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
            value: "(?!axoncore\\.ir$|localhost).*$",
          },
        ],
        destination: "https://axoncore.ir/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
