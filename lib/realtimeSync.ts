import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";
import { bannerService } from "@/services/bannerService";
import { orderService } from "@/services/orderService";

class MasterRealtimeEngine {
  private static instance: MasterRealtimeEngine;
  private channel: RealtimeChannel | null = null;
  private isSubscribed: boolean = false;

  private constructor() {}

  public static getInstance(): MasterRealtimeEngine {
    if (!MasterRealtimeEngine.instance) {
      MasterRealtimeEngine.instance = new MasterRealtimeEngine();
    }
    return MasterRealtimeEngine.instance;
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) return () => {};

    this.channel = supabase.channel("axon_master_realtime_stream_v2026", {
      config: { broadcast: { ack: true } },
    });

    const tables = [
      "products", "orders", "site_info", "banners", "tech_news",
      "coupons", "contact_messages", "posts", "site_pages",
      "site_styles", "menu_items", "categories", "product_reviews", "admin_users"
    ];

    tables.forEach((tableName) => {
      if (!this.channel) return;
      this.channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        async (payload: any) => {
          // دیسپچ رویداد سراسری
          window.dispatchEvent(new CustomEvent(`${tableName}_updated`, { detail: payload.new || payload }));

          if (tableName === "products") {
            const all = await productService.getAll();
            window.dispatchEvent(new CustomEvent("products_updated", { detail: all }));
          } else if (tableName === "site_info") {
            const latest = await siteInfoService.getSiteInfo();
            window.dispatchEvent(new CustomEvent("site_info_updated", { detail: latest }));
            if (latest?.favicon_url && typeof document !== "undefined") {
              let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
              if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
              }
              link.href = latest.favicon_url;
            }
          } else if (tableName === "banners") {
            const allBanners = await bannerService.getAll();
            window.dispatchEvent(new CustomEvent("banners_updated", { detail: allBanners }));
          } else if (tableName === "orders") {
            const allOrders = await orderService.getAll();
            window.dispatchEvent(new CustomEvent("orders_updated", { detail: allOrders }));
          }
        }
      );
    });

    this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        this.isSubscribed = true;
      }
    });

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
        this.isSubscribed = false;
      }
    };
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export default MasterRealtimeEngine;
