import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://axoncore.ir";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/track-order`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  let dynamicProducts: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabaseAdmin.from("products").select("id, updated_at");
    if (products) {
      dynamicProducts = products.map((p) => ({
        url: `${baseUrl}/products/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch {}

  let dynamicPosts: MetadataRoute.Sitemap = [];
  try {
    const { data: posts } = await supabaseAdmin.from("posts").select("id, slug, updated_at");
    if (posts) {
      dynamicPosts = posts.map((p) => ({
        url: `${baseUrl}/blog/${p.slug || p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch {}

  return [...staticPages, ...dynamicProducts, ...dynamicPosts];
}
