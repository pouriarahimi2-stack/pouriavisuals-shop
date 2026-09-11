import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  const now = new Date();

  // صفحات پایه و ساختاری استودیو
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    if (supabaseAdmin) {
      const [prodsRes, postsRes] = await Promise.all([
        supabaseAdmin.from("products").select("id, updated_at, created_at").eq("is_available", true).limit(200),
        supabaseAdmin.from("posts").select("id, slug, updated_at, created_at").eq("is_published", true).limit(200),
      ]);

      if (prodsRes.data && prodsRes.data.length > 0) {
        productRoutes = prodsRes.data.map((p: any) => ({
          url: `${baseUrl}/products/${p.id}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : (p.created_at ? new Date(p.created_at) : now),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      } else {
        productRoutes = FLAGSHIP_7_PRODUCTS.map((p) => ({
          url: `${baseUrl}/products/${p.id}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      }

      if (postsRes.data && postsRes.data.length > 0) {
        blogRoutes = postsRes.data.map((b: any) => ({
          url: `${baseUrl}/blog/${b.slug || b.id}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : (b.created_at ? new Date(b.created_at) : now),
          changeFrequency: "weekly",
          priority: 0.75,
        }));
      }
    }
  } catch {
    productRoutes = FLAGSHIP_7_PRODUCTS.map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
