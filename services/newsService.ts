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

export const STATIC_DEFAULT_NEWS: TechNewsItem[] = [];

export const newsService = {
  async getAll(limit = 30): Promise<TechNewsItem[]> {
    try {
      const { data, error } = await supabase
        .from("tech_news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async getBySlug(slug: string): Promise<TechNewsItem | null> {
    try {
      const { data, error } = await supabase
        .from("tech_news")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
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
