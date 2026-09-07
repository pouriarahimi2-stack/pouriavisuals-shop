// File Path: lib/realtimeSync.ts
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export function applyFaviconToDOM(url?: string) {
  if (typeof document === "undefined" || !url) return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      document.head.appendChild(link);
    }
    link.rel = "icon";
    link.href = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
  } catch {}
}

export function applyTitleToDOM(title?: string, storeName?: string) {
  if (typeof document === "undefined") return;
  try {
    const sName = storeName || "آکسون";
    const sTitle = title || "مرجع تخصصی تجهیزات دیجیتال و تصویر";
    document.title = `${sName} | ${sTitle}`;
  } catch {}
}

declare global {
  interface Window {
    __AXON_REALTIME_SINGLETON__?: MasterRealtimeEngine;
  }
}

class MasterRealtimeEngine {
  private channel: RealtimeChannel | null = null;
  private broadcastBus: BroadcastChannel | null = null;
  private isSubscribed: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastBus = new BroadcastChannel("axon_master_bus_v2026");
        this.broadcastBus.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type) {
            window.dispatchEvent(new CustomEvent(type, { detail: data }));
          }
        };
      } catch {}
    }
  }

  public static getInstance(): MasterRealtimeEngine {
    if (typeof window !== "undefined") {
      if (!window.__AXON_REALTIME_SINGLETON__) {
        window.__AXON_REALTIME_SINGLETON__ = new MasterRealtimeEngine();
      }
      return window.__AXON_REALTIME_SINGLETON__;
    }
    return new MasterRealtimeEngine();
  }

  public broadcastLocally(type: string, data: any) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
    if (this.broadcastBus) {
      try {
        this.broadcastBus.postMessage({ type, data });
      } catch {}
    }
    if (this.channel && this.isSubscribed) {
      try {
        this.channel.send({ type: "broadcast", event: type, payload: data });
      } catch {}
    }
  }

  public init(): () => void {
    if (typeof window === "undefined" || this.isInitialized) return () => {};

    try {
      this.isInitialized = true;
      this.channel = supabase.channel("axon_db_live_stream_v2026", {
        config: { broadcast: { ack: false } },
      });

      // شنود تغییرات واقعی ردیف‌های دیتابیس Supabase (Postgres CDC)
      const tables = [
        "products",
        "orders",
        "site_info",
        "banners",
        "tech_news",
        "posts",
        "contact_messages",
        "coupons",
        "menu_items",
        "categories",
        "site_pages",
        "admin_users",
        "site_styles",
        "product_reviews",
      ];

      tables.forEach((table) => {
        this.channel?.on(
          "postgres_changes" as any,
          { event: "*", schema: "public", table },
          (payload: any) => {
            const eventName = `${table}_updated`;
            window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
            window.dispatchEvent(new CustomEvent("db_mutation_received", { detail: { table, payload } }));
          }
        );
      });

      const broadcastEvents = [
        "products_updated",
        "site_info_updated",
        "banners_updated",
        "orders_updated",
        "coupons_updated",
        "menu_updated",
        "news_updated",
        "contact_messages_updated",
        "posts_updated",
        "admin_users_updated",
        "product_reviews_updated",
      ];

      broadcastEvents.forEach((ev) => {
        this.channel?.on("broadcast", { event: ev }, (payload) => {
          window.dispatchEvent(new CustomEvent(ev, { detail: payload.payload }));
        });
      });

      this.channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.isSubscribed = true;
        }
      });
    } catch (e) {
      console.warn("Realtime initialization notice:", e);
    }

    return () => {};
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export const realtimeEngine = MasterRealtimeEngine.getInstance();
export default MasterRealtimeEngine;
