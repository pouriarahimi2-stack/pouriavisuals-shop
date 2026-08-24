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

export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*");

      if (error) {
        console.error("categoryService error:", error);
        return [];
      }

      return (data || []).sort((a: any, b: any) => 
        (a.order_index ?? a.display_order ?? 0) - (b.order_index ?? b.display_order ?? 0)
      );
    } catch (e) {
      console.error("categoryService.getAll error:", e);
      return [];
    }
  },

  async addCategory(cat: Omit<Category, "id">): Promise<Category | null> {
    try {
      const payload = {
        ...cat,
        order_index: cat.order_index ?? 0,
        display_order: cat.order_index ?? 0,
      };
      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    } catch (e) {
      console.error("categoryService.addCategory error:", e);
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("categoryService.deleteCategory error:", e);
      return false;
    }
  }
};