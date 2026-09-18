import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/news`, lastModified: now, changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];
  let newsRoutes: MetadataRoute.Sitemap = [];
  let modularPageRoutes: MetadataRoute.Sitemap = [];

  try {
    if (supabaseAdmin) {
      const [prodsRes, postsRes, newsRes, pagesRes] = await Promise.all([
        supabaseAdmin.from("products").select("id, updated_at, created_at").eq("is_available", true).limit(300),
        supabaseAdmin.from("posts").select("id, slug, updated_at, created_at").eq("is_published", true).limit(300),
        supabaseAdmin.from("tech_news").select("id, slug, updated_at, created_at").eq("is_published", true).limit(300),
        supabaseAdmin.from("modular_pages").select("slug, updated_at, created_at").eq("is_published", true).limit(100),
      ]);

      if (prodsRes.data) {
        productRoutes = prodsRes.data.map((p: any) => ({
          url: `${baseUrl}/products/${p.id}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      }

      if (postsRes.data) {
        blogRoutes = postsRes.data.map((b: any) => ({
          url: `${baseUrl}/blog/${b.slug || b.id}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.75,
        }));
      }

      if (newsRes.data) {
        newsRoutes = newsRes.data.map((n: any) => ({
          url: `${baseUrl}/news/${n.slug}`,
          lastModified: n.updated_at ? new Date(n.updated_at) : now,
          changeFrequency: "daily",
          priority: 0.8,
        }));
      }

      if (pagesRes.data) {
        modularPageRoutes = pagesRes.data
          .filter((p: any) => p.slug !== "home" && p.slug !== "products" && p.slug !== "blog" && p.slug !== "news")
          .map((p: any) => ({
            url: `${baseUrl}/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : now,
            changeFrequency: "weekly",
            priority: 0.7,
          }));
      }
    }
  } catch {}

  return [...staticRoutes, ...productRoutes, ...blogRoutes, ...newsRoutes, ...modularPageRoutes];
}
