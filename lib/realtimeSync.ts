import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeEventPayload<T = any> {
  eventType: "INSERT" | "UPDATE" | "DELETE" | "SYNC";
  table: string;
  newRecord: T | null;
  oldRecord: T | null;
  timestamp: number;
}

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
        (payload: any) => {
          const customPayload: RealtimeEventPayload = {
            eventType: payload.eventType,
            table: tableName,
            newRecord: payload.new || null,
            oldRecord: payload.old || null,
            timestamp: Date.now(),
          };

          window.dispatchEvent(new CustomEvent(`${tableName}_updated`, { detail: customPayload }));

          if (tableName === "site_info") {
            const info = payload.new || payload;
            window.dispatchEvent(new CustomEvent("site_info_updated", { detail: info }));
            if (info?.favicon_url && typeof document !== "undefined") {
              let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
              if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
              }
              link.href = info.favicon_url;
            }
          } else if (tableName === "products") {
            window.dispatchEvent(new CustomEvent("products_realtime_mutation", { detail: customPayload }));
          }
        }
      );
    });

    this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") this.isSubscribed = true;
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
