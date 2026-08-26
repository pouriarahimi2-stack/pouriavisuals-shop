// services/categoryService.ts
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
      if (supabase) {
        const { data, error } = await supabase.from("categories").select("*");

        if (!error && data) {
          return data.sort(
            (a: any, b: any) =>
              (a.order_index ?? a.display_order ?? 0) - (b.order_index ?? b.display_order ?? 0)
          );
        }
      }
      return [
        { name: "نمایشگرهای ۵K و ۴K", slug: "monitors", order_index: 1 },
        { name: "کارت کپچر و استریم", slug: "capture-cards", order_index: 2 },
        { name: "کالیبراتور رنگ سخت‌افزاری", slug: "calibrators", order_index: 3 },
        { name: "لوازم جانبی استودیو", slug: "accessories", order_index: 4 },
      ];
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
          window.dispatchEvent(new CustomEvent("categories_updated", { detail: data }));
        }
        return data as Category;
      }
      return { id: `cat_${Date.now()}`, ...payload };
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
        window.dispatchEvent(new CustomEvent("categories_updated", { detail: id }));
      }
      return true;
    } catch (e) {
      console.error("categoryService.deleteCategory error:", e);
      return false;
    }
  },
};