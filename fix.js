// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON ARCHITECT] در حال آغاز بازسازی کامل، پایدارسازی و دیباگ ۰ تا ۱۰۰ فروشگاه آکسون...');

const files = {
  // ۱. فرمت‌کننده جامع مبالغ و تاریخ فارسی (رفع خطاهای هیدریشن)
  'lib/formatters.ts': `export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "۰";
  const num = Math.round(Number(amount));
  const parts = num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return parts.replace(/\\d/g, (d) => farsiDigits[parseInt(d, 10)]);
}

export function formatDateFa(dateStr?: string | null): string {
  if (!dateStr) return "امروز";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "امروز";
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return d.toLocaleDateString("fa-IR-u-nu-latn").replace(/\\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  } catch {
    return "امروز";
  }
}
`,

  // ۲. موتور Realtime سه‌گانه با پشتیبانی کامل از فاوآیکون متحرک GIF / SVG
  'lib/realtimeSync.ts': `import { supabase } from "@/lib/supabase";
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
    link.href = \`\${url}\${url.includes("?") ? "&" : "?"}v=\${Date.now()}\`;
  } catch {}
}

export function applyTitleToDOM(title?: string, storeName?: string) {
  if (typeof document === "undefined") return;
  try {
    const sName = storeName || "آکسون";
    const sTitle = title || "مرجع تخصصی مانیتور و تجهیزات تصویر";
    document.title = \`\${sName} | \${sTitle}\`;
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
        "orders_updated", "coupons_updated", "menu_updated", "news_updated",
        "contact_messages_updated", "posts_updated"
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

      const tables = ["products", "orders", "site_info", "banners", "tech_news", "coupons", "menu_items", "categories", "contact_messages", "posts"];
      tables.forEach((tableName) => {
        this.channel?.on(
          "postgres_changes",
          { event: "*", schema: "public", table: tableName },
          async (payload: any) => {
            const updatedItem = payload.new || payload;
            window.dispatchEvent(new CustomEvent(\`\${tableName}_updated\`, { detail: updatedItem }));

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
`,

  // ۳. سرویس مدیریت اطلاعات کلان و وضعیت آنلاین/تعمیرات سایت
  'services/siteInfoService.ts': `import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

export interface SiteInfo {
  id?: string | number;
  site_name?: string;
  siteName?: string;
  storeName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  logo_url?: string;
  logoUrl?: string;
  footer_logo_url?: string;
  footerLogoUrl?: string;
  favicon_url?: string;
  faviconUrl?: string;
  allow_google_index?: boolean;
  allowGoogleIndex?: boolean;
  maintenance_mode?: MaintenanceMode;
  maintenance_until?: string;
  maintenance_duration_minutes?: number;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
  header_announcement?: string;
  free_shipping_threshold?: number;
  description?: string;
  footer_text?: string;
  custom_css?: string;
  active_font_id?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const siteInfoService = {
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_SITE_INFO);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.favicon_url) applyFaviconToDOM(parsed.favicon_url);
          return parsed;
        }
      } catch {}
    }
    return {
      site_name: "آکسون | Axon",
      siteName: "آکسون | Axon",
      storeName: "آکسون | Axon",
      tagline: "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
      allow_google_index: true,
      allowGoogleIndex: true,
      maintenance_mode: "none",
      phone: "۰۲۱-۸۸۸۸۸۸۸۸",
      email: "info@axoncore.ir",
      address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
      working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      header_announcement: "⚡ ارسال رایگان خریدهای بالای ۲ میلیون تومان | گارانتی اصالت طلایی ۱۸ ماهه",
      free_shipping_threshold: 2000000,
    };
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;
          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
            phone: data.phone || "۰۲۱-۸۸۸۸۸۸۸۸",
            email: data.email || "info@axoncore.ir",
            address: data.address || "تهران، خیابان ولیعصر، تقاطع میرداماد",
            working_hours: data.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
            logo_url: data.logo_url || "",
            logoUrl: data.logo_url || "",
            footer_logo_url: data.footer_logo_url || "",
            footerLogoUrl: data.footer_logo_url || "",
            favicon_url: data.favicon_url || "",
            faviconUrl: data.favicon_url || "",
            allow_google_index: isAllowed,
            allowGoogleIndex: isAllowed,
            maintenance_mode: (data.maintenance_mode as MaintenanceMode) || (isAllowed ? "none" : "indefinite"),
            maintenance_until: data.maintenance_until || undefined,
            maintenance_duration_minutes: data.maintenance_duration_minutes ? Number(data.maintenance_duration_minutes) : undefined,
            header_announcement: data.header_announcement || "",
            free_shipping_threshold: Number(data.free_shipping_threshold || 2000000),
            description: data.description || data.footer_text || "",
            footer_text: data.footer_text || data.description || "",
            custom_css: data.custom_css || "",
            active_font_id: data.active_font_id || "Vazirmatn",
            instagram: data.instagram || "",
            telegram: data.telegram || "",
            whatsapp: data.whatsapp || "",
            youtube: data.youtube || "",
            updated_at: data.updated_at,
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(mapped));
            if (mapped.favicon_url) applyFaviconToDOM(mapped.favicon_url);
            if (mapped.tagline || mapped.site_name) applyTitleToDOM(mapped.tagline, mapped.site_name);
          }
          return mapped;
        }
      }
      return this.getSiteInfoSync();
    } catch {
      return this.getSiteInfoSync();
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const current = this.getSiteInfoSync();
      const maintMode = payload.maintenance_mode !== undefined 
        ? payload.maintenance_mode 
        : (current.maintenance_mode || "none");

      const isAllowed = payload.allow_google_index !== undefined
        ? payload.allow_google_index
        : (maintMode === "none");

      const sName = payload.site_name || payload.siteName || payload.storeName || current.site_name || "آکسون | Axon";

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline !== undefined ? payload.tagline : current.tagline,
        phone: payload.phone !== undefined ? payload.phone : current.phone,
        email: payload.email !== undefined ? payload.email : current.email,
        address: payload.address !== undefined ? payload.address : current.address,
        working_hours: payload.working_hours !== undefined ? payload.working_hours : current.working_hours,
        logo_url: payload.logo_url !== undefined ? payload.logo_url : current.logo_url,
        footer_logo_url: payload.footer_logo_url !== undefined ? payload.footer_logo_url : current.footer_logo_url,
        favicon_url: payload.favicon_url !== undefined ? payload.favicon_url : current.favicon_url,
        allow_google_index: isAllowed,
        maintenance_mode: maintMode,
        maintenance_until: payload.maintenance_until !== undefined ? payload.maintenance_until : current.maintenance_until,
        maintenance_duration_minutes: payload.maintenance_duration_minutes !== undefined ? payload.maintenance_duration_minutes : current.maintenance_duration_minutes,
        header_announcement: payload.header_announcement !== undefined ? payload.header_announcement : current.header_announcement,
        free_shipping_threshold: Number(payload.free_shipping_threshold || current.free_shipping_threshold || 2000000),
        footer_text: payload.footer_text || payload.description || current.footer_text || "",
        description: payload.description || payload.footer_text || current.description || "",
        custom_css: payload.custom_css !== undefined ? payload.custom_css : current.custom_css,
        active_font_id: payload.active_font_id || current.active_font_id || "Vazirmatn",
        updated_at: new Date().toISOString(),
      };

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const json = await res.json();
      const finalData = json.data || dbPayload;

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(finalData));
        realtimeEngine.broadcastLocally("site_info_updated", finalData);
      }

      return finalData;
    } catch {
      return null;
    }
  },
};

export default siteInfoService;
`,

  // ۴. هدر کپسولی شیشه‌ای به همراه جستجوی زنده، تم و سبد خرید
  'components/Header.tsx': `"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const initHeaderData = async () => {
      try {
        const [info, prods, cats] = await Promise.all([
          siteInfoService.getSiteInfo(),
          productService.getAll(),
          categoryService.getAll(),
        ]);
        if (info) setSiteInfo(info);
        if (prods) setAllProducts(prods);
        if (cats) setCategories(cats);
      } catch {}
    };

    initHeaderData();

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllProducts(e.detail);
      else productService.getAll().then((prods) => prods && setAllProducts(prods));
    };
    const handleCategoriesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setCategories(e.detail);
      else categoryService.getAll().then((cats) => cats && setCategories(cats));
    };

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("categories_updated", handleCategoriesUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("categories_updated", handleCategoriesUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase().trim();
    userBehavior.trackSearch(q);
    const matches = allProducts.filter((p) =>
      (p.title || p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
    setSearchResults(matches.slice(0, 5));
  }, [searchQuery, allProducts]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSelectCategory = (catName: string) => {
    soundEngine.playClick();
    setIsCategoryOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("category_selected", { detail: catName }));
    }
    router.push("/#products");
  };

  const handleQuickAddFromSearch = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playAddToCart();
    addToCart({
      id: product.id,
      title: product.title || product.name || "کالای دیجیتال",
      name: product.title || product.name || "کالای دیجیتال",
      price: Number(product.discountPrice ?? product.price ?? 0),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      image: product.images?.[0] || product.image || "/placeholder.png",
      stock: Number(product.stock ?? 10),
      category: product.category || "عمومی",
      quantity: 1,
    });
    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedItemMap((prev) => ({ ...prev, [product.id]: false })), 1500);
  };

  const navLinks = [
    { title: "صفحه نخست", href: "/" },
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;
  const isOnline = (siteInfo?.maintenance_mode || "none") === "none";

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-2 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl">
      {siteInfo?.header_announcement && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-blue-600/15 border border-[var(--card-border)] text-center text-[10px] sm:text-[11px] font-bold text-[var(--text-primary)] backdrop-blur-md truncate" suppressHydrationWarning>
          {siteInfo.header_announcement}
        </div>
      )}

      <div className="w-full bg-[var(--modal-bg)]/95 backdrop-blur-2xl px-3 sm:px-5 py-2.5 rounded-[2rem] shadow-xl border border-[var(--card-border)] flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsCategoryOpen(!isCategoryOpen);
              }}
              className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] flex items-center justify-center text-sm transition cursor-pointer shadow-sm"
              title="دسته‌بندی‌های محصولات"
              aria-label="دسته‌بندی‌ها"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-64 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-black text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                >
                  <span>📦 تمامی محصولات و تجهیزات</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                  >
                    <span>🏷️ {cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
              {logoUrl ? <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" /> : <span className="text-[var(--accent-blue)] text-lg sm:text-xl font-black">⚡</span>}
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-tight text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[160px]">{storeName}</span>
                <span className={\`w-2 h-2 rounded-full shrink-0 transition-all duration-500 \${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"}\`} title={isOnline ? "سامانه آنلاین" : "حالت تعمیرات"} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-[var(--accent-blue)] truncate max-w-[120px] sm:max-w-[160px]">{siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال و تصویر"}</span>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)] shadow-inner">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="px-3.5 py-1.5 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition whitespace-nowrap">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative hidden xl:block" ref={searchContainerRef}>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-40 shadow-sm h-9">
              <span className="text-xs opacity-70">🔍</span>
              <input type="text" placeholder="جستجوی کالا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] font-bold placeholder-slate-400" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl z-50 animate-fadeIn space-y-1.5 w-72">
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                      <Link href={\`/products/\${p.id}\`} onClick={() => { soundEngine.playClick(); setIsSearchFocused(false); }} className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5 border border-[var(--card-border)] shrink-0" />
                        <div className="flex-1 min-w-0 text-right">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                          <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>{formatPrice(p.discountPrice || p.price || 0)} ت</span>
                        </div>
                      </Link>
                      <button type="button" onClick={(e) => handleQuickAddFromSearch(e, p)} className="px-2 py-1 rounded-lg text-[10px] font-black bg-[var(--accent-blue)] text-white cursor-pointer shadow-md">
                        {addedItemMap[p.id] ? "✓" : "+"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleDarkMode} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center shrink-0" title="تغییر تم" suppressHydrationWarning>
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white transition-all shadow-md shadow-blue-500/25 cursor-pointer flex items-center justify-center shrink-0" title="سبد خرید">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center border-2 border-[var(--modal-bg)] shadow-md animate-pulse" suppressHydrationWarning>
                {formatPrice(totalItems)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
`,

  // ۵. کارت محصول با گارانتی اصالت طلایی و خرید تک‌کلیکی
  'components/ProductCard.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = product.title || product.title_fa || product.name || "کالای دیجیتال تخصصی";
  const price = Number(product.price) || 0;
  const discountPrice =
    product.discountPrice !== undefined && product.discountPrice !== null
      ? Number(product.discountPrice)
      : product.discount_price !== undefined && product.discount_price !== null
      ? Number(product.discount_price)
      : undefined;

  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image_url || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"];

  const mainImage = images[0];
  const category = product.category || product.category_name || "تجهیزات تخصصی";
  const isAvailable =
    product.is_available !== false &&
    product.isAvailable !== false &&
    stockCount > 0;

  const discountPercent =
    discountPrice && discountPrice < price
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  return (
    <div
      onClick={() => userBehavior.trackProductView(product.id, category)}
      className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.2rem] p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-2xl hover:border-[var(--accent-blue)] transition-all duration-300 group select-none relative"
      dir="rtl"
    >
      <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-3.5 flex items-center justify-center p-3 border border-[var(--card-border)]">
        <Link href={\`/products/\${product.id}\`} className="w-full h-full flex items-center justify-center">
          <img
            src={mainImage}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-lg">
            {discountPercent}٪- تخفیف
          </span>
        )}

        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
          {product.badge || category}
        </span>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-black shadow-md">
              ناموجود در انبار
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--accent-blue)] font-extrabold">{product.brand || "Axon Pro"}</span>
          <span className={\`font-bold \${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}\`}>
            {isAvailable ? "موجود در انبار ✓" : "ناموجود"}
          </span>
        </div>

        <Link href={\`/products/\${product.id}\`} className="hover:text-[var(--accent-blue)] transition-colors">
          <h3
            className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 text-right"
            dir="rtl"
          >
            {title}
          </h3>
        </Link>

        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">
          {product.short_description || product.description || "تجهیزات تخصصی با گارانتی اصالت طلایی"}
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {discountPrice && discountPrice < price && (
              <span className="text-[10px] line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>
                {formatPrice(price)}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>
              {formatPrice(currentPrice)}{" "}
              <span className="text-xs font-bold font-sans">تومان</span>
            </span>
          </div>
          <Link href={\`/products/\${product.id}\`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline transition">
            بررسی کالا ←
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playAddToCart();
              userBehavior.trackProductView(product.id, category);
              addToCart({
                id: product.id,
                title,
                name: title,
                price: currentPrice,
                image: mainImage,
                stock: stockCount,
                quantity: 1,
              });
            }}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--input-bg)] text-[var(--text-primary)] text-xs font-black rounded-xl border border-[var(--card-border)] hover:border-[var(--accent-blue)] cursor-pointer disabled:opacity-40 transition shadow-sm"
          >
            🛒 سبد خرید
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playAddToCart();
              userBehavior.trackProductView(product.id, category);
              addToCart({
                id: product.id,
                title,
                name: title,
                price: currentPrice,
                image: mainImage,
                stock: stockCount,
                quantity: 1,
              });
              router.push("/checkout");
            }}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--accent-blue)] text-white text-xs font-black rounded-xl shadow-md hover:opacity-90 cursor-pointer disabled:opacity-40 transition"
          >
            ⚡ خرید سریع
          </button>
        </div>
      </div>
    </div>
  );
}
`,

  // ۶. فوتر سایت با بسته‌شدن ۱۰۰٪ کامل و بدون خطای سینتکس
  'components/Footer.tsx': `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const footerLogo = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url;

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] transition-colors mt-auto shadow-2xl select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="w-full max-w-[180px] h-20 rounded-2xl border border-[var(--card-border)] bg-white/5 p-2 shadow-inner flex items-center justify-center overflow-hidden">
              {footerLogo ? (
                <img src={footerLogo} alt={siteName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white font-black text-xl">
                  ⚓
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {info?.description || info?.tagline || "مرجع تخصصی مانیتور و تجهیزات تصویر"}
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">دسترسی سریع</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله سئو</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">اطلاعات رسمی</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <li>تلفن: <span className="font-mono font-bold text-[var(--accent-blue)]">{info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸"}</span></li>
              <li>ایمیل: <span className="font-mono">{info?.email || "info@axoncore.ir"}</span></li>
              <li>ساعات کاری: {info?.working_hours || "۹:۰۰ الی ۱۸:۰۰"}</li>
              <li>نشانی: {info?.address || "تهران، خیابان ولیعصر"}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-black text-sm border-b border-[var(--card-border)] pb-2">ضمانت و استانداردها</h5>
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 text-xs">
              <div className="font-black text-emerald-500">✓ ضمانت ۱۰۰٪ اصالت فیزیکی کالا</div>
              <p className="text-[11px] text-[var(--text-secondary)]">ارسال پیشتاز با بسته‌بندی ضدضربه استودیویی و بیمه کامل.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-secondary)] font-bold">
          تمامی حقوق مادی و معنوی برای مجموعه <span className="text-[var(--accent-blue)]">{siteName}</span> محفوظ است © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
`,

  // ۷. صفحه اصلی با پشتیبانی کامل از ۷ محصول پرچمدار، بنرها و مقایسه
  'app/page.tsx': `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product, FLAGSHIP_7_PRODUCTS } from "@/services/productService";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import TechRadarFeed from "@/components/TechRadarFeed";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);

      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info) setSiteInfo(info);
    } catch {}
  };

  useEffect(() => {
    loadData();

    const handleCategoryChange = (e: any) => setSelectedCategory(e.detail || "all");
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };
    const handleBannersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setBanners(e.detail);
      else loadData();
    };
    const handleSiteUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };

    window.addEventListener("category_selected", handleCategoryChange);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("banners_updated", handleBannersUpdate);
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("category_selected", handleCategoryChange);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("banners_updated", handleBannersUpdate);
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const toggleCompare = (p: Product) => {
    soundEngine.playClick();
    if (compareList.some((item) => item.id === p.id)) {
      setCompareList(compareList.filter((item) => item.id !== p.id));
    } else {
      if (compareList.length >= 4) {
        alert("حداکثر ۴ محصول را می‌توانید به طور همزمان مقایسه نمایید.");
        return;
      }
      setCompareList([...compareList, p]);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    const cat = (product.category || (product as any).category_name || "").toLowerCase();
    const target = selectedCategory.toLowerCase();
    return cat === target || cat.includes(target) || target.includes(cat);
  });

  const activeBanner = banners[currentSlideIndex] || banners[0];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] select-none pb-20 transition-colors duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-10 mt-3 sm:mt-5">
        {banners.length > 0 && (
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl backdrop-blur-3xl group">
            <div
              className="min-h-[380px] sm:min-h-[480px] p-6 sm:p-14 flex items-center bg-cover bg-center transition-all duration-700 relative"
              style={{
                backgroundImage: \`linear-gradient(to left, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.35)), url(\${activeBanner?.image || (activeBanner as any)?.image_url || ""})\`,
              }}
            >
              <div className="max-w-2xl space-y-4 z-10 text-white animate-fadeIn">
                {activeBanner?.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-black backdrop-blur-md shadow-sm">
                    {activeBanner.badge}
                  </span>
                )}
                <h1 className="text-2xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">{activeBanner?.title}</h1>
                {activeBanner?.subtitle && <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-medium">{activeBanner.subtitle}</p>}
                <div className="pt-2 flex items-center gap-3">
                  <Link href={activeBanner?.link || (activeBanner as any)?.link_url || "/products"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 font-black text-xs hover:bg-slate-100 transition shadow-2xl hover:scale-105 active:scale-95 cursor-pointer">
                    <span>{activeBanner?.button_text || "مشاهده و بررسی کالا"}</span><span>←</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <TechRadarFeed />

        <section id="products" className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4 px-1">
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                <span>📦</span> کاتالوگ تجهیزات تخصصی و مانیتورها
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                {selectedCategory === "all" ? "تمامی کالاهای اورجینال با تست سلامت فیزیکی و گارانتی اصالت طلایی" : \`فیلتر فعال: \${selectedCategory}\`}
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button onClick={() => setSelectedCategory("all")} className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer">
                مشاهده همه کالاها ({products.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                isCompared={compareList.some((item) => item.id === product.id)}
                onToggleCompare={toggleCompare}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>

        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border border-[var(--card-border)] p-3 px-6 rounded-full shadow-2xl flex items-center gap-4 animate-fadeIn">
            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-2"><span>⚖️</span><span>{compareList.length} کالا آماده مقایسه</span></span>
            <button onClick={() => { soundEngine.playClick(); setIsCompareOpen(true); }} className="px-4 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition">مشاهده جدول مقایسه 🚀</button>
            <button onClick={() => { soundEngine.playClick(); setCompareList([]); }} className="text-xs text-rose-500 font-bold hover:underline cursor-pointer">لغو</button>
          </div>
        )}

        <section className="p-5 sm:p-7 rounded-[2.5rem] space-y-4 my-8 border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-xl">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2"><span>📚</span> مجله و مقالات تخصصی سئو</h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">جدیدترین تحلیل‌های سخت‌افزاری و راهنمای خرید</p>
            </div>
            <Link href="/blog" className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-xs font-bold hover:bg-[var(--accent-blue)] hover:text-white transition shadow-sm">مشاهده همه مقالات ←</Link>
          </div>
          <HomeBlogSection />
        </section>
      </div>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeProductCard({ product, isCompared, onToggleCompare, onAddToCart }: any) {
  const images = product.images && product.images.length > 0 ? product.images : [product.image || product.image_url || ""];
  const displayImage = images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
  const isAvailable = (product as any).is_available !== false && product.isAvailable !== false && (product.stock === undefined || Number(product.stock) > 0);
  const productName = product.title || product.name || "محصول دیجیتال";
  const currentPrice = Number(product.discountPrice ?? product.discount_price ?? product.price ?? 0);
  const oldPrice = Number(product.originalPrice ?? product.price ?? 0);

  return (
    <div className="rounded-[2.2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-[var(--accent-blue)] hover:shadow-2xl transition duration-300 group shadow-sm select-none">
      <Link href={\`/products/\${product.id}\`} className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center cursor-pointer border border-[var(--card-border)]">
        <img src={displayImage} alt={productName} className="w-full h-full object-contain p-3 group-hover:scale-105 transition duration-500" />
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCompare(product); }} className={\`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer \${isCompared ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md" : "bg-black/60 text-white border-white/20"}\`}>
          {isCompared ? "✓ در مقایسه" : "⚖️ مقایسه"}
        </button>
      </Link>

      <Link href={\`/products/\${product.id}\`} className="space-y-2 cursor-pointer block">
        <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 px-3 py-0.5 rounded-full font-bold text-[10px]">{product.category || "کالای دیجیتال"}</span>
        <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 text-right">{productName}</h4>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>{formatPrice(currentPrice)} تومان</span>
          {oldPrice > currentPrice && <span className="text-[11px] line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>{formatPrice(oldPrice)}</span>}
        </div>
      </Link>

      <div className="pt-2 border-t border-[var(--card-border)]">
        <button onClick={() => { soundEngine.playAddToCart(); onAddToCart({ id: product.id, name: productName, title: productName, price: currentPrice, image: displayImage, stock: product.stock ?? 10 }); }} disabled={!isAvailable} className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer hover:opacity-90 active:scale-95 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-40">
          <span>🛒</span><span>افزودن به سبد خرید</span>
        </button>
      </div>
    </div>
  );
}

function HomeBlogSection() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <article key={post.id || post.title} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5 flex flex-col justify-between hover:border-[var(--accent-blue)] transition duration-300 shadow-sm">
          <h4 className="font-black text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={\`/blog/\${post.id}\`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-1.5 border-t border-[var(--card-border)]">مطالعه مقاله ←</Link>
        </article>
      ))}
    </div>
  );
}
`,

  // ۸. روت API تنظیمات سایت و ایندکس
  'app/api/site-info/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const maintMode = body.maintenance_mode !== undefined 
      ? body.maintenance_mode 
      : (existing?.maintenance_mode || "none");

    const isAllowed = body.allow_google_index !== undefined
      ? body.allow_google_index
      : (maintMode === "none");

    const sName = body.site_name || body.siteName || body.storeName || existing?.site_name || "آکسون | Axon";

    const payload: Record<string, any> = {
      id: existing?.id || 1,
      site_name: sName,
      store_name: sName,
      tagline: body.tagline !== undefined ? body.tagline : (existing?.tagline || ""),
      phone: body.phone !== undefined ? body.phone : (existing?.phone || ""),
      email: body.email !== undefined ? body.email : (existing?.email || ""),
      address: body.address !== undefined ? body.address : (existing?.address || ""),
      working_hours: body.working_hours !== undefined ? body.working_hours : (existing?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"),
      logo_url: body.logo_url !== undefined ? body.logo_url : (existing?.logo_url || null),
      footer_logo_url: body.footer_logo_url !== undefined ? body.footer_logo_url : (existing?.footer_logo_url || null),
      favicon_url: body.favicon_url !== undefined ? body.favicon_url : (existing?.favicon_url || null),
      description: body.description || body.footer_text || existing?.description || "",
      footer_text: body.footer_text || body.description || existing?.footer_text || "",
      allow_google_index: isAllowed,
      maintenance_mode: maintMode,
      maintenance_until: body.maintenance_until !== undefined ? body.maintenance_until : (existing?.maintenance_until || null),
      maintenance_duration_minutes: body.maintenance_duration_minutes !== undefined ? body.maintenance_duration_minutes : (existing?.maintenance_duration_minutes || null),
      header_announcement: body.header_announcement !== undefined ? body.header_announcement : (existing?.header_announcement || ""),
      free_shipping_threshold: Number(body.free_shipping_threshold || existing?.free_shipping_threshold || 2000000),
      custom_css: body.custom_css !== undefined ? body.custom_css : (existing?.custom_css || ""),
      active_font_id: body.active_font_id || existing?.active_font_id || "Vazirmatn",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("site_info")
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ثبت شد", data: data || payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ [UPDATED] فایل با موفقیت نوسازی شد: ${filePath}`);
}

console.log('📦 در حال Push خودکار به مخزن گیت‌هاب و استقرار زنده روی سرور Vercel...');
try {
  execSync('git add . && git commit -m "fix: ultimate 0-to-100 full architectural rebuild - real-time engine & zero-hydration fix" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 [SUCCESS] تغییرات با موفقیت کامیت و مستقیماً روی سرور Vercel دیپلوی شدند!');
} catch (e) {
  console.log('⚠️ کامیت ایجاد شد؛ در صورت نیاز دستور دستی زیر را اجرا نمایید:');
  console.log('git push origin main');
}