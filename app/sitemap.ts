// File Path: app/sitemap.ts
import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir").replace(/\/+$/, "");
  const fallbackDate = new Date("2025-01-01T00:00:00Z");

  let siteLastModified: Date = fallbackDate;
  let backupModularPagesMap: Record<string, any> = {};

  try {
    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("updated_at, created_at, homepage_layout_config")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (siteRow?.updated_at) {
      siteLastModified = new Date(siteRow.updated_at);
    } else if (siteRow?.created_at) {
      siteLastModified = new Date(siteRow.created_at);
    }

    const customCanonical =
      siteRow?.homepage_layout_config?.seo_technical_config?.canonicalBaseUrl;
    if (typeof customCanonical === "string" && customCanonical.startsWith("http")) {
      baseUrl = customCanonical.trim().replace(/\/+$/, "");
    }

    if (siteRow?.homepage_layout_config?.modular_pages_map) {
      backupModularPagesMap = siteRow.homepage_layout_config.modular_pages_map;
    }
  } catch {}

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: siteLastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: siteLastModified,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: siteLastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: siteLastModified,
      changeFrequency: "always",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: siteLastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: siteLastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];
  let newsRoutes: MetadataRoute.Sitemap = [];
  let modularPageRoutes: MetadataRoute.Sitemap = [];

  try {
    if (supabaseAdmin) {
      const [prodsRes, postsRes, newsRes, pagesRes] = await Promise.all([
        supabaseAdmin
          .from("products")
          .select("id, updated_at, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabaseAdmin
          .from("posts")
          .select("id, slug, updated_at, created_at, is_published")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("tech_news")
          .select("id, slug, updated_at, created_at, is_published")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("modular_pages")
          .select("slug, updated_at, created_at, is_published")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (prodsRes.data) {
        productRoutes = prodsRes.data.map((p: any) => ({
          url: `${baseUrl}/products/${p.id}`,
          lastModified: p.updated_at
            ? new Date(p.updated_at)
            : p.created_at
            ? new Date(p.created_at)
            : siteLastModified,
          changeFrequency: "daily" as const,
          priority: 0.85,
        }));
      }

      if (postsRes.data) {
        blogRoutes = postsRes.data
          .filter((b: any) => b.is_published !== false)
          .map((b: any) => ({
            url: `${baseUrl}/blog/${b.slug || b.id}`,
            lastModified: b.updated_at
              ? new Date(b.updated_at)
              : b.created_at
              ? new Date(b.created_at)
              : siteLastModified,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }));
      }

      if (newsRes.data) {
        newsRoutes = newsRes.data
          .filter((n: any) => n.is_published !== false && n.slug)
          .map((n: any) => ({
            url: `${baseUrl}/news/${n.slug}`,
            lastModified: n.updated_at
              ? new Date(n.updated_at)
              : n.created_at
              ? new Date(n.created_at)
              : siteLastModified,
            changeFrequency: "daily" as const,
            priority: 0.75,
          }));
      }

      const reservedSlugs = new Set([
        "home",
        "products",
        "blog",
        "news",
        "about",
        "contact",
        "admin",
        "login",
        "checkout",
      ]);
      const addedSlugs = new Set<string>();

      if (pagesRes.data) {
        pagesRes.data.forEach((p: any) => {
          const cleanSlug = String(p?.slug || "").trim().toLowerCase();
          if (
            cleanSlug &&
            p.is_published !== false &&
            !reservedSlugs.has(cleanSlug) &&
            !addedSlugs.has(cleanSlug)
          ) {
            addedSlugs.add(cleanSlug);
            modularPageRoutes.push({
              url: `${baseUrl}/${cleanSlug}`,
              lastModified: p.updated_at ? new Date(p.updated_at) : siteLastModified,
              changeFrequency: "weekly" as const,
              priority: 0.75,
            });
          }
        });
      }

      Object.entries(backupModularPagesMap).forEach(([slugKey, pageObj]: [string, any]) => {
        const cleanSlug = String(slugKey || "").trim().toLowerCase();
        if (
          cleanSlug &&
          pageObj &&
          !pageObj._deleted &&
          pageObj.is_published !== false &&
          !reservedSlugs.has(cleanSlug) &&
          !addedSlugs.has(cleanSlug)
        ) {
          addedSlugs.add(cleanSlug);
          modularPageRoutes.push({
            url: `${baseUrl}/${cleanSlug}`,
            lastModified: pageObj.updated_at ? new Date(pageObj.updated_at) : siteLastModified,
            changeFrequency: "weekly" as const,
            priority: 0.75,
          });
        }
      });
    }
  } catch {}

  return [
    ...staticRoutes,
    ...productRoutes,
    ...blogRoutes,
    ...newsRoutes,
    ...modularPageRoutes,
  ];
}