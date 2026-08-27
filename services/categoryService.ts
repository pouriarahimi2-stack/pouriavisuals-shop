// File Path: services/categoryService.ts
import { supabase } from "@/lib/supabase";

export interface Category {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  order_index?: number;
  display_order?: number;
}

const LOCAL_CATEGORIES_CACHE = "axon_categories_cache_v2026";

export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("order_index", { ascending: true });

        if (!error && data) {
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_CATEGORIES_CACHE, JSON.stringify(data));
          }
          return data;
        }
      }

      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_CATEGORIES_CACHE);
        if (cached) return JSON.parse(cached);
      }

      return [];
    } catch (e) {
      console.error("categoryService.getAll error:", e);
      return [];
    }
  },

  async addCategory(cat: Omit<Category, "id">): Promise<Category | null> {
    try {
      const payload = {
        name: cat.name.trim(),
        slug: (cat.slug || cat.name).trim().toLowerCase().replace(/\s+/g, "-"),
        order_index: cat.order_index ?? 0,
        display_order: cat.order_index ?? 0,
      };

      if (supabase) {
        const { data, error } = await supabase
          .from("categories")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        if (typeof window !== "undefined") {
          const all = await this.getAll();
          const updated = [...all, data];
          localStorage.setItem(LOCAL_CATEGORIES_CACHE, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("categories_updated", { detail: data }));
        }

        return data as Category;
      }
      return null;
    } catch (e) {
      console.error("categoryService.addCategory error:", e);
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.filter((c) => c.id !== id);
        localStorage.setItem(LOCAL_CATEGORIES_CACHE, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("categories_updated", { detail: id }));
      }
      return true;
    } catch (e) {
      console.error("categoryService.deleteCategory error:", e);
      return false;
    }
  },
};