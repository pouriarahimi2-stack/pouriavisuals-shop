// File Path: app/sitemap.ts
import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const fallbackDate = new Date("2025-01-01T00:00:00Z");

  let siteLastModified: Date = fallbackDate;
  try {
    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (siteRow?.updated_at) {
      siteLastModified = new Date(siteRow.updated_at);
    } else if (siteRow?.created_at) {
      siteLastModified = new Date(siteRow.created_at);
    }
  } catch {}

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,          lastModified: siteLastModified, changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: siteLastModified, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/news`,     lastModified: siteLastModified, changeFrequency: "always",  priority: 0.9 },
    { url: `${baseUrl}/blog`,     lastModified: siteLastModified, changeFrequency: "daily",   priority: 0.85 },
    { url: `${baseUrl}/about`,    lastModified: siteLastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`,  lastModified: siteLastModified, changeFrequency: "monthly", priority: 0.6 },
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
          lastModified: p.updated_at ? new Date(p.updated_at) : fallbackDate,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
      }

      if (postsRes.data) {
        blogRoutes = postsRes.data.map((b: any) => ({
          url: `${baseUrl}/blog/${b.slug || b.id}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : fallbackDate,
          changeFrequency: "weekly" as const,
          priority: 0.75,
        }));
      }

      if (newsRes.data) {
        newsRoutes = newsRes.data.map((n: any) => ({
          url: `${baseUrl}/news/${n.slug}`,
          lastModified: n.updated_at ? new Date(n.updated_at) : fallbackDate,
          changeFrequency: "daily" as const,
          priority: 0.8,
        }));
      }

      if (pagesRes.data) {
        modularPageRoutes = pagesRes.data
          .filter((p: any) => p.slug !== "home" && p.slug !== "products" && p.slug !== "blog" && p.slug !== "news")
          .map((p: any) => ({
            url: `${baseUrl}/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : fallbackDate,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }));
      }
    }
  } catch {}

  return [...staticRoutes, ...productRoutes, ...blogRoutes, ...newsRoutes, ...modularPageRoutes];
}
