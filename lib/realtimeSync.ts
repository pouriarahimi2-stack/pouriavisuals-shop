import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * معماری یکپارچه Master Realtime Singleton
 * جلوگیری از نشت اتصالات وب‌سوکت، توزیع رویدادهای زنده استاندارد به سراسر کلاینت
 */

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
  private reconnectAttempts: number = 0;

  private constructor() {}

  public static getInstance(): MasterRealtimeEngine {
    if (!MasterRealtimeEngine.instance) {
      MasterRealtimeEngine.instance = new MasterRealtimeEngine();
    }
    return MasterRealtimeEngine.instance;
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) {
      return () => {};
    }

    this.channel = supabase.channel("axon_master_realtime_sync_v2026", {
      config: {
        broadcast: { ack: true },
        presence: { key: "client" },
      },
    });

    const tables = [
      "products",
      "orders",
      "site_info",
      "banners",
      "tech_news",
      "coupons",
      "contact_messages",
      "posts",
      "site_pages",
      "site_styles",
      "menu_items",
      "categories",
      "product_reviews",
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

          // ۱. انتشار رویداد استاندارد بر اساس نام جدول
          window.dispatchEvent(
            new CustomEvent(`${tableName}_updated`, { detail: customPayload })
          );

          // ۲. انتشار سازگاری برای لیسنرهای قدیمی
          if (tableName === "site_info") {
            window.dispatchEvent(
              new CustomEvent("site_info_updated", { detail: payload.new || payload })
            );
          } else if (tableName === "products") {
            window.dispatchEvent(
              new CustomEvent("products_realtime_mutation", { detail: customPayload })
            );
          } else if (tableName === "orders") {
            window.dispatchEvent(
              new CustomEvent("orders_realtime_mutation", { detail: customPayload })
            );
          }
        }
      );
    });

    this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        this.isSubscribed = true;
        this.reconnectAttempts = 0;
        if (process.env.NODE_ENV !== "production") {
          console.log("⚡ [Master Realtime] WebSocket connection active and listening to 13 database tables.");
        }
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        this.isSubscribed = false;
        this.handleReconnect();
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

  private handleReconnect() {
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts += 1;
      const delay = Math.min(5000, this.reconnectAttempts * 1000);
      setTimeout(() => {
        this.init();
      }, delay);
    }
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export default MasterRealtimeEngine;