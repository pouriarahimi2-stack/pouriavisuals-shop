import { supabase } from "./supabase";

// جدول سفارشات از این لیست حذف شده تا حریم خصوصی مشتریان افشا نشود
const SAFE_PUBLIC_TABLES = [
  "products",
  "banners",
  "site_info",
  "categories",
  "posts",
  "tech_news"
];

let activeChannel: any = null;
const debounceTimers: Record<string, NodeJS.Timeout | null> = {};

export const realtimeEngine = {
  init() {
    if (typeof window === "undefined" || activeChannel) return () => {};

    const ch = supabase.channel("axon_public_realtime_stream");

    SAFE_PUBLIC_TABLES.forEach((tbl) => {
      ch.on("postgres_changes", { event: "*", schema: "public", table: tbl }, (payload) => {
        if (debounceTimers[tbl]) clearTimeout(debounceTimers[tbl] as NodeJS.Timeout);
        debounceTimers[tbl] = setTimeout(() => {
          window.dispatchEvent(new CustomEvent(`db_${tbl}_updated`, { detail: payload }));
        }, 180);
      });
    });

    ch.subscribe();
    activeChannel = ch;

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  },

  broadcastLocally(eventName: string, data: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
  }
};

export function applyTitleToDOM(tagline?: string, siteName?: string) {
  if (typeof document !== "undefined") {
    if (tagline && siteName) {
      document.title = `${siteName} | ${tagline}`;
    } else if (tagline || siteName) {
      document.title = tagline || siteName || "آکسون کور | Axon";
    }
  }
}

export function applyFaviconToDOM(iconUrl: string) {
  if (typeof document !== "undefined" && iconUrl) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "shortcut icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = iconUrl;
  }
}
