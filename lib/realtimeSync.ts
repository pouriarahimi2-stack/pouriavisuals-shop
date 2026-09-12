import { supabase } from "./supabase";

const SAFE_PUBLIC_TABLES = [
  "products",
  "banners",
  "site_info",
  "categories",
  "posts",
  "tech_news"
];

let activeChannel: any = null;
let debounceTimer: NodeJS.Timeout | null = null;

export const realtimeEngine = {
  init() {
    if (typeof window === "undefined" || activeChannel) return () => {};

    const ch = supabase.channel("axon_public_updates");

    SAFE_PUBLIC_TABLES.forEach((tbl) => {
      ch.on("postgres_changes", { event: "*", schema: "public", table: tbl }, (payload) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent(`db_${tbl}_updated`, { detail: payload }));
        }, 200);
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

/**
 * تنظیم عنوان صفحه بر اساس شعار و نام برند (پشتیبانی از ۱ یا ۲ آرگومان اختیاری)
 */
export function applyTitleToDOM(tagline?: string, siteName?: string) {
  if (typeof document !== "undefined") {
    if (tagline && siteName) {
      document.title = `${siteName} | ${tagline}`;
    } else if (tagline || siteName) {
      document.title = tagline || siteName || "آکسون | Axon";
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
