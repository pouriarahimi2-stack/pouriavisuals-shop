import { MetadataRoute } from "next";

export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  // صفحات ثابت و اصلی سایت
  const routes = [
    "",
    "/about",
    "/contact",
    "/blog",
    "/checkout",
    "/track-order",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  return [...routes];
}