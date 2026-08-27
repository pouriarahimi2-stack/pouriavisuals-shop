// File Path: services/newsService.ts
import { supabase } from "@/lib/supabase";

export interface TechNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: "gadgets" | "gaming" | "ai" | "apple" | "hardware" | "general";
  source_name: string;
  source_url?: string;
  image_url: string;
  published_at: string;
  views_count?: number;
  trending_score?: number;
  tags?: string[];
  is_published?: boolean;
}

const LOCAL_NEWS_KEY = "axon_tech_radar_news_cache";

export const newsService = {
  async getAll(): Promise<TechNewsItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("tech_news")
          .select("*")
          .order("published_at", { ascending: false });

        if (!error && data) {
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(data));
          }
          return data as TechNewsItem[];
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_NEWS_KEY);
        if (local) return JSON.parse(local);
      }

      return [];
    } catch (e) {
      console.error("newsService.getAll Error:", e);
      return [];
    }
  },

  async getBySlug(slug: string): Promise<TechNewsItem | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("tech_news")
          .select("*")
          .eq("slug", slug.trim().toLowerCase())
          .maybeSingle();

        if (!error && data) {
          return data as TechNewsItem;
        }
      }

      const all = await this.getAll();
      return all.find((n) => n.slug === slug.trim().toLowerCase()) || null;
    } catch (e) {
      console.error("newsService.getBySlug Error:", e);
      return null;
    }
  },

  async saveNewsItem(item: Partial<TechNewsItem>): Promise<TechNewsItem | null> {
    try {
      const cleanSlug = (item.slug || item.title || `news-${Date.now()}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        title: item.title?.trim() || "خبر تکنولوژی",
        slug: cleanSlug,
        summary: item.summary?.trim() || "",
        content: item.content?.trim() || "",
        category: item.category || "gadgets",
        source_name: item.source_name || "Global Tech Wire",
        source_url: item.source_url || "",
        image_url: item.image_url || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200",
        published_at: item.published_at || new Date().toISOString(),
        trending_score: item.trending_score || 95,
        tags: item.tags || ["تکنولوژی", "گجت", "سخت‌افزار"],
        is_published: item.is_published !== false,
      };

      if (supabase) {
        let result: any;
        if (item.id && !item.id.startsWith("temp_") && !item.id.startsWith("news-")) {
          const { data, error } = await supabase
            .from("tech_news")
            .update(payload)
            .eq("id", item.id)
            .select()
            .single();
          if (error) throw error;
          result = data;
        } else {
          const { data, error } = await supabase
            .from("tech_news")
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          result = data;
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("news_updated", { detail: result }));
        }
        return result as TechNewsItem;
      }

      return null;
    } catch (e) {
      console.error("newsService.saveNewsItem Error:", e);
      return null;
    }
  },

  async deleteNewsItem(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("tech_news").delete().eq("id", id);
      }
      if (typeof window !== "undefined") {
        const current = await this.getAll();
        const updated = current.filter((n) => n.id !== id);
        localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("news_updated", { detail: id }));
      }
      return true;
    } catch (e) {
      console.error("newsService.deleteNewsItem Error:", e);
      return false;
    }
  },
};