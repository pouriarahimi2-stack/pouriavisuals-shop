import { supabase } from "@/lib/supabase";

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  order: number;
  is_active: boolean;
  category_slug?: string;
}

const LOCAL_STORAGE_KEY = "site_menu_items";

export const menuService = {
  async getAll(): Promise<MenuItem[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("order", { ascending: true });

        if (!error && data && data.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) return JSON.parse(local);

      // آیتم‌های پیش‌فرض در صورت خالی بودن دیتابیس
      const defaults: MenuItem[] = [
        { id: "menu_1", title: "صفحه اصلی", url: "/", order: 1, is_active: true },
        { id: "menu_2", title: "محصولات", url: "/#products", order: 2, is_active: true },
        { id: "menu_3", title: "مجله تخصصی", url: "/blog", order: 3, is_active: true },
        { id: "menu_4", title: "پیگیری سفارش", url: "/track-order", order: 4, is_active: true },
        { id: "menu_5", title: "تماس با ما", url: "/contact", order: 5, is_active: true },
      ];
      return defaults;
    } catch (e) {
      console.error("Error fetching menu items:", e);
      return [];
    }
  },

  async saveAll(items: MenuItem[]): Promise<boolean> {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));

      if (supabase) {
        // حذف و جایگزینی آیتم‌های منو در دیتابیس
        await supabase.from("menu_items").delete().neq("id", "0");
        await supabase.from("menu_items").insert(items);
      }

      // انتشار رویداد بلادرنگ در تب جاری
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("menu_updated", { detail: items }));

        // هماهنگی با سایر تب‌ها
        if ("BroadcastChannel" in window) {
          const channel = new BroadcastChannel("menu_sync_channel");
          channel.postMessage({ type: "SYNC_MENU", data: items });
          channel.close();
        }
      }

      return true;
    } catch (e) {
      console.error("Error saving menu items:", e);
      return false;
    }
  },
};