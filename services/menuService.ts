import { supabase } from "@/lib/supabase";

export interface MenuItem {
  id: string | number;
  title?: string;
  name?: string;
  label?: string;
  url?: string;
  href?: string;
  order?: number;
  isActive?: boolean;
  is_active?: boolean;
}

export const menuService = {
  async getAll(): Promise<MenuItem[]> {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("order", { ascending: true });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async saveAll(items: MenuItem[]): Promise<boolean> {
    try {
      await supabase.from("menu_items").delete().neq("id", "-1");
      const { error } = await supabase.from("menu_items").insert(
        items.map((item, idx) => ({
          title: item.title || item.name || item.label,
          url: item.url || item.href || "/",
          order: idx + 1,
          is_active: item.is_active !== false && item.isActive !== false,
        }))
      );
      return !error;
    } catch {
      return false;
    }
  },
};
