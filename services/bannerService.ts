import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position?: "hero" | "middle" | "side";
  is_active: boolean;
  created_at?: string;
}

const STORAGE_KEY = "site_banners_db";

export const bannerService = {
  async getAll(): Promise<Banner[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn("Supabase banners fetch failed:", err);
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local !== null) return JSON.parse(local);
    }
    return [];
  },

  async create(banner: Banner): Promise<{ success: boolean; data?: Banner }> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("banners").insert([banner]).select();
        if (!error && data && data.length > 0) {
          const current = await this.getAll();
          localStorage.setItem(STORAGE_KEY, JSON.stringify([data[0], ...current]));
          return { success: true, data: data[0] };
        }
      }
    } catch (err) {
      console.warn("Supabase banner insert failed:", err);
    }

    const current = await this.getAll();
    const updated = [banner, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true, data: banner };
  },

  async update(id: string, updates: Partial<Banner>): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("banners").update(updates).eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase banner update failed:", err);
    }

    const current = await this.getAll();
    const updated = current.map((b) => (b.id === id ? { ...b, ...updates } : b));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  async delete(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("banners").delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase banner delete failed:", err);
    }

    const current = await this.getAll();
    const updated = current.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },
};