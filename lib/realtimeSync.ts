import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";
import { bannerService } from "@/services/bannerService";

export function applyFaviconToDOM(url?: string) {
  if (typeof document === "undefined" || !url) return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      document.head.appendChild(link);
    }
    
    if (url.includes("image/gif") || url.endsWith(".gif")) {
      link.type = "image/gif";
    } else if (url.includes("image/svg") || url.endsWith(".svg")) {
      link.type = "image/svg+xml";
    } else if (url.includes("image/png") || url.endsWith(".png")) {
      link.type = "image/png";
    } else {
      link.type = "image/x-icon";
    }

    link.rel = "icon";
    link.href = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
  } catch {}
}

export function applyTitleToDOM(title?: string, storeName?: string) {
  if (typeof document === "undefined") return;
  try {
    const sName = storeName || "آکسون";
    const sTitle = title || "مرجع تخصصی مانیتور و تجهیزات تصویر";
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

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastBus = new BroadcastChannel("axon_master_bus_v2026");
        this.broadcastBus.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type) {
            window.dispatchEvent(new CustomEvent(type, { detail: data }));
            if (type === "site_info_updated" && data) {
              if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
              if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
            }
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
    
    if (type === "site_info_updated" && data) {
      if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
      if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
    }

    if (this.channel && this.isSubscribed) {
      try {
        this.channel.send({
          type: "broadcast",
          event: type,
          payload: data,
        });
      } catch {}
    }
  }

  public init(): () => void {
    if (typeof window === "undefined") return () => {};
    if (this.isSubscribed && this.channel) return () => {};

    try {
      this.channel = supabase.channel("axon_main_stream_v2026", {
        config: { broadcast: { ack: false } },
      });

      const eventNames = [
        "products_updated", "site_info_updated", "banners_updated",
        "orders_updated", "coupons_updated", "menu_updated", "news_updated"
      ];

      eventNames.forEach((ev) => {
        this.channel?.on("broadcast", { event: ev }, (payload) => {
          window.dispatchEvent(new CustomEvent(ev, { detail: payload.payload }));
          if (ev === "site_info_updated" && payload.payload) {
            if (payload.payload.favicon_url) applyFaviconToDOM(payload.payload.favicon_url);
            if (payload.payload.tagline || payload.payload.site_name) applyTitleToDOM(payload.payload.tagline, payload.payload.site_name);
          }
        });
      });

      const tables = ["products", "orders", "site_info", "banners", "tech_news", "coupons", "menu_items", "categories"];
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
              if (latest?.favicon_url) applyFaviconToDOM(latest.favicon_url);
              if (latest?.tagline || latest?.site_name) applyTitleToDOM(latest?.tagline, latest?.site_name);
            } else if (tableName === "banners") {
              const allBanners = await bannerService.getAll();
              window.dispatchEvent(new CustomEvent("banners_updated", { detail: allBanners }));
            }
          }
        );
      });

      this.channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.isSubscribed = true;
        }
      });
    } catch {}

    return () => {};
  }
}

export function initRealtimeSync(): () => void {
  return MasterRealtimeEngine.getInstance().init();
}

export const realtimeEngine = MasterRealtimeEngine.getInstance();
export default MasterRealtimeEngine;
