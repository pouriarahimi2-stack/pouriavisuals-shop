import { supabase } from "@/lib/supabase";

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badge_text?: string;
  image: string;
  image_url?: string;
  link?: string;
  link_url?: string;
  button_text?: string;
  buttonText?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_BANNERS_KEY = "axon_banners_cache_v2026";

export const bannerService = {
  async getAll(): Promise<Banner[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Banner[] = data.map((b: any) => ({
            id: String(b.id),
            title: b.title || "پیشنهاد ویژه",
            subtitle: b.subtitle || "",
            badge: b.badge || b.badge_text || "",
            badge_text: b.badge || b.badge_text || "",
            image: b.image || b.image_url || "/placeholder.png",
            image_url: b.image || b.image_url || "/placeholder.png",
            link: b.link || b.link_url || "/products",
            link_url: b.link || b.link_url || "/products",
            button_text: b.button_text || b.buttonText || "مشاهده و خرید کالا",
            buttonText: b.button_text || b.buttonText || "مشاهده و خرید کالا",
            is_active: b.is_active !== false,
            created_at: b.created_at,
          }));

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem(LOCAL_BANNERS_KEY);
        if (local) return JSON.parse(local);
      }

      return [];
    } catch (e) {
      console.error("bannerService.getAll error:", e);
      return [];
    }
  },

  async getActive(): Promise<Banner[]> {
    const all = await this.getAll();
    return all.filter((b) => b.is_active !== false);
  },

  async saveBanner(bannerData: Partial<Banner>): Promise<Banner | null> {
    try {
      const id = bannerData.id || `banner_${Date.now()}`;
      const payload: any = {
        id,
        title: bannerData.title?.trim() || "پیشنهاد ویژه",
        subtitle: bannerData.subtitle?.trim() || null,
        badge: bannerData.badge?.trim() || bannerData.badge_text?.trim() || null,
        badge_text: bannerData.badge?.trim() || bannerData.badge_text?.trim() || null,
        image: bannerData.image || bannerData.image_url || "/placeholder.png",
        image_url: bannerData.image || bannerData.image_url || "/placeholder.png",
        link: bannerData.link || bannerData.link_url || "/products",
        link_url: bannerData.link || bannerData.link_url || "/products",
        button_text: bannerData.button_text || bannerData.buttonText || "مشاهده و بررسی کالا",
        is_active: bannerData.is_active !== false,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("banners").upsert(payload, { onConflict: "id" });
      }

      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = [payload, ...all.filter((b) => b.id !== id)];
        localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("banners_updated", { detail: updated }));
      }

      return payload;
    } catch (e) {
      console.error("bannerService.saveBanner error:", e);
      return null;
    }
  },

  async deleteBanner(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("banners").delete().eq("id", id);
      }
      if (typeof window !== "undefined") {
        const all = await this.getAll();
        const updated = all.filter((b) => b.id !== id);
        localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("banners_updated", { detail: updated }));
      }
      return true;
    } catch (e) {
      console.error("bannerService.deleteBanner error:", e);
      return false;
    }
  },
};

export default bannerService;
