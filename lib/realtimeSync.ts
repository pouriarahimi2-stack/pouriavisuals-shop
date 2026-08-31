import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";

class MasterRealtimeEngine {
  private static instance: MasterRealtimeEngine;
  private channel: RealtimeChannel | null = null;
  private broadcastBus: BroadcastChannel | null = null;
  private isSubscribed: boolean = false;

  private constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastBus = new BroadcastChannel("axon_internal_bus");
      this.broadcastBus.onmessage = (event) => {
        const { type, data } = event.data;
        if (type) {
          window.dispatchEvent(new CustomEvent(type, { detail: data }));
        }
      };
    }
  }

  public static getInstance(): MasterRealtimeEngine {
    if (!MasterRealtimeEngine.instance) {
      MasterRealtimeEngine.instance = new MasterRealtimeEngine();
    }
    return MasterRealtimeEngine.instance;
  }

  public broadcastLocally(type: string, data: any) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
    if (this.broadcastBus) {
      this.broadcastBus.postMessage({ type, data });
    }
    if (this.channel) {
      this.channel.send({
        type: "broadcast",
        event: type,
        payload: data,
      }).catch(() => {});
    }
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) return () => {};

    this.channel = supabase.channel("axon_global_stream_v2026", {
      config: { broadcast: { ack: false } },
    });

    // ۱. لیسنر به پیام‌های برودکست وب‌سوکت
    const eventNames = [
      "products_updated", "site_info_updated", "banners_updated",
      "orders_updated", "coupons_updated", "menu_updated", "news_updated"
    ];

    eventNames.forEach((ev) => {
      this.channel?.on("broadcast", { event: ev }, (payload) => {
        window.dispatchEvent(new CustomEvent(ev, { detail: payload.payload }));
      });
    });

    // ۲. لیسنر به تغییرات پایگاه داده سوپابیس
    const tables = [
      "products", "orders", "site_info", "banners", "tech_news",
      "coupons", "contact_messages", "posts", "site_pages", "menu_items"
    ];

    tables.forEach((tableName) => {
      this.channel?.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        async (payload: any) => {
          const updatedItem = payload.new || payload;
          window.dispatchEvent(new CustomEvent(`${tableName}_updated`, { detail: updatedItem }));

          if (tableName === "products") {
            const all = await productService.getAll();
            window.dispatchEvent(new CustomEvent("products_updated", { detail: all }));
          } else if (tableName === "site_info") {
            const latest = await siteInfoService.getSiteInfo();
            window.dispatchEvent(new CustomEvent("site_info_updated", { detail: latest }));
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

export const realtimeEngine = MasterRealtimeEngine.getInstance();
export default MasterRealtimeEngine;
