import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/blog",
          "/blog/*",
          "/about",
          "/contact",
          "/api/torob",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/admin/*",
          "/api/user/*",
          "/checkout",
          "/checkout/*",
          "/payment",
          "/payment/*",
          "/login",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
