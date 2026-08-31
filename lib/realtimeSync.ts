import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";
import { bannerService } from "@/services/bannerService";
import { newsService } from "@/services/newsService";
import { menuService } from "@/services/menuService";
import { categoryService } from "@/services/categoryService";
import { couponService } from "@/services/couponService";
import { orderService } from "@/services/orderService";

export function applyFaviconToDOM(url?: string) {
  if (typeof document === "undefined" || !url) return;
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
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
    __AXON_SINGLETON_REALTIME__?: MasterRealtimeEngine;
  }
}

class MasterRealtimeEngine {
  private channel: RealtimeChannel | null = null;
  private broadcastBus: BroadcastChannel | null = null;
  private isSubscribed: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastBus = new BroadcastChannel("axon_master_stream_channel");
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
      if (!window.__AXON_SINGLETON_REALTIME__) {
        window.__AXON_SINGLETON_REALTIME__ = new MasterRealtimeEngine();
      }
      return window.__AXON_SINGLETON_REALTIME__;
    }
    return new MasterRealtimeEngine();
  }

  public broadcastLocally(type: string, data: any) {
    if (typeof window === "undefined") return;
    
    // ۱. انتشار در تب جاری
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
    
    // ۲. ارسال به تمام تب‌های دیگر در همان مرورگر در ۰ میلی‌ثانیه
    if (this.broadcastBus) {
      try {
        this.broadcastBus.postMessage({ type, data });
      } catch {}
    }
    
    // ۳. تغییر فوری فاوآیکون و تایتل
    if (type === "site_info_updated" && data) {
      if (data.favicon_url) applyFaviconToDOM(data.favicon_url);
      if (data.tagline || data.site_name) applyTitleToDOM(data.tagline, data.site_name);
    }

    // ۴. ارسال به سایر کاربران از طریق سوکت سوپابیس
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

    try {
      this.channel = supabase.channel("axon_global_realtime_v2", {
        config: { broadcast: { ack: false } },
      });

      const eventNames = [
        "products_updated", "site_info_updated", "banners_updated",
        "orders_updated", "coupons_updated", "menu_updated", "news_updated",
        "categories_updated", "contact_messages_updated", "posts_updated"
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

      const tables = [
        "products", "orders", "site_info", "banners", "tech_news",
        "coupons", "contact_messages", "posts", "site_pages", "menu_items", "categories"
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
              if (latest?.favicon_url) applyFaviconToDOM(latest.favicon_url);
              if (latest?.tagline || latest?.site_name) applyTitleToDOM(latest?.tagline, latest?.site_name);
            } else if (tableName === "banners") {
              const allBanners = await bannerService.getAll();
              window.dispatchEvent(new CustomEvent("banners_updated", { detail: allBanners }));
            } else if (tableName === "tech_news") {
              const allNews = await newsService.getAll();
              window.dispatchEvent(new CustomEvent("news_updated", { detail: allNews }));
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
