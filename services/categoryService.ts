import { supabase } from "@/lib/supabase";

export interface Category {
  id?: string;
  name: string;
  slug: string;
  order?: number;
  created_at?: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async addCategory(cat: { name: string; slug?: string }): Promise<Category | null> {
    try {
      const cleanName = cat.name.trim();
      const cleanSlug = (cat.slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        name: cleanName,
        slug: cleanSlug,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Database insert category error:", error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error("Add category error:", e);
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};
