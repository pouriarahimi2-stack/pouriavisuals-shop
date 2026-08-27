// File Path: services/menuService.ts
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

const LOCAL_MENU_KEY = "axon_site_menu_items_cache";

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
            localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_MENU_KEY);
        if (local) {
          return JSON.parse(local).map((d: any, idx: number) => normalizeMenuItem(d, idx));
        }
      }

      return [];
    } catch (e) {
      console.error("Error loading menu:", e);
      return [];
    }
  },

  async saveAll(items: MenuItem[]): Promise<boolean> {
    try {
      const normalized = items.map((d, idx) => normalizeMenuItem(d, idx));

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(normalized));
      }

      if (supabase) {
        const payload = normalized.map((item) => ({
          title: item.title,
          url: item.url,
          order: item.order,
          is_active: item.isActive,
        }));

        await supabase.from("menu_items").delete().neq("id", "-1");
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