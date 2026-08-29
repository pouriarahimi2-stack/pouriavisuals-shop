// File Path: app/sitemap.ts
import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";

  try {
    const [productsRes, blogsRes, newsRes] = await Promise.all([
      supabaseAdmin.from("products").select("id, updated_at").order("updated_at", { ascending: false }),
      supabaseAdmin.from("posts").select("id, slug, updated_at").order("updated_at", { ascending: false }),
      supabaseAdmin.from("tech_news").select("slug, published_at").eq("is_published", true).order("published_at", { ascending: false }),
    ]);

    const productUrls: MetadataRoute.Sitemap = (productsRes.data || []).map((product: any) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    }));

    const blogUrls: MetadataRoute.Sitemap = (blogsRes.data || []).map((blog: any) => ({
      url: `${baseUrl}/blog/${blog.slug || blog.id}`,
      lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    const newsUrls: MetadataRoute.Sitemap = (newsRes.data || []).map((news: any) => ({
      url: `${baseUrl}/news/${news.slug}`,
      lastModified: news.published_at ? new Date(news.published_at) : new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    }));

    const staticUrls: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
      { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
      { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.95 },
      { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
      { url: `${baseUrl}/track-order`, lastModified: new Date(), changeFrequency: "always", priority: 0.75 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ];

    return [...staticUrls, ...productUrls, ...newsUrls, ...blogUrls];
  } catch {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
      { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ];
  }
}