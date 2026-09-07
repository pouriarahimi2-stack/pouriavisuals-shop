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
        .order("created_at", { ascending: true });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async addCategory(cat: { name: string; slug: string }): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: cat.name.trim(), slug: cat.slug.trim(), created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
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
