// services/menuService.ts
import { supabase } from "@/lib/supabase";

export interface MenuItem {
  id: string | number;
  title: string;
  name?: string;
  label?: string;
  url: string;
  href?: string;
  order: number;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "site_menu_items";

export function normalizeMenuItem(raw: any, index: number = 0): MenuItem {
  if (!raw) return {} as MenuItem;

  const id = raw.id || `menu_${Date.now()}_${index}`;
  const title = raw.title || raw.name || raw.label || "پیوند";
  const url = raw.url || raw.href || "#";
  const order = Number(raw.order ?? index + 1);
  const isActive =
    raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : raw.is_active !== undefined
      ? Boolean(raw.is_active)
      : true;

  return {
    ...raw,
    id,
    title,
    name: title,
    label: title,
    url,
    href: url,
    order,
    isActive,
    is_active: isActive,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export const menuService = {
  async getAll(): Promise<MenuItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("order", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any, idx: number) => normalizeMenuItem(d, idx));
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          return JSON.parse(local).map((d: any, idx: number) => normalizeMenuItem(d, idx));
        }
      }

      const defaults: MenuItem[] = [
        { id: "m_1", title: "صفحه نخست", url: "/", order: 1, isActive: true },
        { id: "m_2", title: "کاتالوگ محصولات", url: "/#products", order: 2, isActive: true },
        { id: "m_3", title: "📡 رادار اخبار تکنولوژی", url: "/news", order: 3, isActive: true },
        { id: "m_4", title: "پیگیری مرسوله پستی", url: "/track-order", order: 4, isActive: true },
        { id: "m_5", title: "مجله و مقالات سئو", url: "/blog", order: 5, isActive: true },
        { id: "m_6", title: "تماس با پشتیبانی", url: "/contact", order: 6, isActive: true },
      ];

      return defaults.map((d, idx) => normalizeMenuItem(d, idx));
    } catch (e) {
      console.error("Error loading menu:", e);
      return [];
    }
  },

  async getMenuItems(): Promise<MenuItem[]> {
    return this.getAll();
  },

  async saveAll(items: MenuItem[]): Promise<boolean> {
    try {
      const normalized = items.map((d, idx) => normalizeMenuItem(d, idx));

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      }

      if (supabase) {
        const payload = normalized.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          order: item.order,
          is_active: item.isActive,
        }));

        await supabase.from("menu_items").delete().neq("id", "0");
        await supabase.from("menu_items").insert(payload);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("menu_updated", { detail: normalized }));
      }

      return true;
    } catch (e) {
      console.error("Error saving menu:", e);
      return false;
    }
  },
};