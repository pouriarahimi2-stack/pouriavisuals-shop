import { supabase } from "@/lib/supabase";

export interface TechNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: "hardware" | "gadgets" | "ai" | "gaming";
  source_name: string;
  source_url?: string;
  image_url: string;
  published_at: string;
  trending_score?: number;
  tags?: string[];
  is_published?: boolean;
}

export const STATIC_DEFAULT_NEWS: TechNewsItem[] = [
  {
    id: "news-1",
    title: "رونمایی از نسل جدید پنل‌های نانوتکستچر با دقت رنگ DCI-P3",
    slug: "nano-texture-display-p3-tech",
    summary: "استاندارد جدید نمایشگرهای استودیویی در رویداد تخصصی سخت‌افزار معرفی شد.",
    content: "گزارش کامل پیشرفت فناوری پنل‌های 5K و کنترل بازتاب نور در محیط‌های استودیویی.",
    category: "hardware",
    source_name: "Tech News Wire",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    published_at: new Date().toISOString(),
    is_published: true,
  }
];

export const newsService = {
  async getAll(limit = 30): Promise<TechNewsItem[]> {
    try {
      const { data, error } = await supabase
        .from("tech_news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        return STATIC_DEFAULT_NEWS;
      }
      return data;
    } catch {
      return STATIC_DEFAULT_NEWS;
    }
  },

  async getBySlug(slug: string): Promise<TechNewsItem | null> {
    try {
      const { data, error } = await supabase
        .from("tech_news")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) return data;
      return STATIC_DEFAULT_NEWS.find((n) => n.slug === slug) || null;
    } catch {
      return STATIC_DEFAULT_NEWS.find((n) => n.slug === slug) || null;
    }
  },

  async saveNewsItem(item: Partial<TechNewsItem>): Promise<TechNewsItem | null> {
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async deleteNewsItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("tech_news").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};
