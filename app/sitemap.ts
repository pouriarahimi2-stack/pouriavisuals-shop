// app/sitemap.ts
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://axoncore.ir';

  // دریافت تمام محصولات فعال
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .order('updated_at', { ascending: false });

  // دریافت تمام مقالات وبلاگ فعال
  const { data: blogs } = await supabase
    .from('posts')
    .select('id, updated_at')
    .order('updated_at', { ascending: false });

  // دریافت تمام اخبار رادار تکنولوژی
  const { data: newsItems } = await supabase
    .from('tech_news')
    .select('slug, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const blogUrls: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
    url: `${baseUrl}/blog/${blog.id}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const newsUrls: MetadataRoute.Sitemap = (newsItems || []).map((news) => ({
    url: `${baseUrl}/news/${news.slug}`,
    lastModified: news.published_at ? new Date(news.published_at) : new Date(),
    changeFrequency: 'hourly',
    priority: 0.85,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.6,
    },
  ];

  return [...staticUrls, ...productUrls, ...newsUrls, ...blogUrls];
}