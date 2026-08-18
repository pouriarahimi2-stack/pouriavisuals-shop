import { supabase } from "@/lib/supabase";

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  position: "main_slider" | "grid_top" | "grid_bottom" | "sidebar";
  order: number;
  isActive: boolean;
}

const LOCAL_STORAGE_KEY = "site_banners_list";

export const bannerService = {
  async getAll(): Promise<BannerItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("order", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: BannerItem[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            subtitle: d.subtitle,
            imageUrl: d.image_url || d.imageUrl,
            linkUrl: d.link_url || d.linkUrl,
            position: d.position,
            order: d.order,
            isActive: d.is_active ?? d.isActive ?? true,
          }));

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) return JSON.parse(local);

      // بنرهای پیش‌فرض اولیه در صورت خالی بودن دیتابیس
      const defaults: BannerItem[] = [
        {
          id: "ban_1",
          title: "مانیتورهای تخصصی تدوین و رنگ",
          subtitle: "کالیبراسیون حرفه‌ای 4K و 8K",
          imageUrl: "/banners/main-slider-1.jpg",
          linkUrl: "/#products",
          position: "main_slider",
          order: 1,
          isActive: true,
        },
        {
          id: "ban_2",
          title: "تجهیزات نورپردازی استودیو",
          subtitle: "ارسال پیشتاز به سراسر کشور",
          imageUrl: "/banners/main-slider-2.jpg",
          linkUrl: "/#products",
          position: "main_slider",
          order: 2,
          isActive: true,
        },
        {
          id: "ban_3",
          title: "کارت‌های کپچر و استریم حرفه‌ای",
          subtitle: "تخفیف‌های ویژه فصل",
          imageUrl: "/banners/grid-banner-1.jpg",
          linkUrl: "/#products",
          position: "grid_top",
          order: 1,
          isActive: true,
        },
      ];
      return defaults;
    } catch (e) {
      console.error("Error loading banners:", e);
      return [];
    }
  },

  async saveAll(items: BannerItem[]): Promise<boolean> {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));

      if (supabase) {
        const payload = items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          image_url: item.imageUrl,
          link_url: item.linkUrl,
          position: item.position,
          order: item.order,
          is_active: item.isActive,
        }));

        await supabase.from("banners").delete().neq("id", "0");
        await supabase.from("banners").insert(payload);
      }

      this.broadcast(items);
      return true;
    } catch (e) {
      console.error("Error saving banners:", e);
      return false;
    }
  },

  broadcast(banners: BannerItem[]) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("banners_updated", { detail: banners }));
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("banners_sync_channel");
        channel.postMessage({ type: "SYNC_BANNERS", data: banners });
        channel.close();
      }
    }
  },
};