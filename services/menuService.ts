import { supabase } from "@/lib/supabase";

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  order_index?: number;
  is_active: boolean;
  created_at?: string;
}

const STORAGE_KEY = "site_menus_db";

export const menuService = {
  // دریافت تمامی منوها از Supabase با کش محلی
  async getAll(): Promise<MenuItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("menus")
          .select("*")
          .order("order_index", { ascending: true });

        if (!error && data && data.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
          return data;
        }
      }
    } catch (err) {
      console.warn("Supabase menus fetch failed:", err);
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local !== null) return JSON.parse(local);
    }

    return [
      { id: "menu-1", title: "صفحه اصلی", url: "/", order_index: 1, is_active: true },
      { id: "menu-2", title: "محصولات", url: "/products", order_index: 2, is_active: true },
      { id: "menu-3", title: "مجله و بلاگ", url: "/blog", order_index: 3, is_active: true },
      { id: "menu-4", title: "پیگیری سفارش", url: "/track-order", order_index: 4, is_active: true },
      { id: "menu-5", title: "درباره ما", url: "/about", order_index: 5, is_active: true },
      { id: "menu-6", title: "تماس با ما", url: "/contact", order_index: 6, is_active: true },
    ];
  },

  // الیاس‌های مورد نیاز برای سازگاری کامل با Footer.tsx و Navbar
  async getMenuItems(): Promise<MenuItem[]> {
    return this.getAll();
  },

  async getMenus(): Promise<MenuItem[]> {
    return this.getAll();
  },

  async create(menu: MenuItem): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("menus").insert([menu]);
      }
    } catch (err) {
      console.warn("Supabase menu create failed:", err);
    }

    const current = await this.getAll();
    const updated = [...current, menu];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },

  async update(id: string, updates: Partial<MenuItem>): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("menus").update(updates).eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase menu update failed:", err);
    }

    const current = await this.getAll();
    const updated = current.map((m) => (m.id === id ? { ...m, ...updates } : m));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("menus").delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase menu delete failed:", err);
    }

    const current = await this.getAll();
    const updated = current.filter((m) => m.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },
};