import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // این آدرس دامنه اصلی شماست
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/admin/*", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}