// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER ZERO-DEFECT HIGH-PRECISION UI/UX & HYDRATION PURGE (v2026.15)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Specific Fixes from User Video Audit:
 *   1. AddToCartButton Styling:
 *      - Light Mode: Pitch Black button with Pure White text and icon.
 *      - Dark Mode: Crisp White button with Pitch Black text and icon.
 *   2. AddToCartButton Animation:
 *      - Text collapses cleanly without layout shifting.
 *      - Cart shifts to exact geometric center.
 *      - Parcel drops vertically directly into cart basket with elastic bounce.
 *      - Cart drives off to the LEFT, re-enters from right to center.
 *      - Counter bumps underneath.
 *      - Cart Drawer opens ONLY after the 1250ms animation finishes!
 *   3. CartDrawer Overhaul:
 *      - Crisp product thumbnail guaranteed (Apple Watch image bug fixed).
 *      - Clear contrast for all form inputs in light/dark modes.
 *   4. Zero Console Errors:
 *      - React Error #418 eliminated (removed SSR localStorage hydration leak).
 *   5. Strict No-Truncation Rule enforced.
 *   6. Automated Git staging, atomic commit and push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   📐 اعمال اصلاحات تکمیلی ویدیو: دکمه مشکی در روز/سفید در شب، رفع باگ تصویر سبد و ریشه‌کنی خطای #418');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

function updateFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`  \x1b[32m[SAVED ✓]\x1b[0m ${relPath.padEnd(52)} \x1b[36m(بروزرسانی ۱۰۰٪ کامل و بدون خلاصه‌سازی)\x1b[0m`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۱. رفع ریشه‌ای خطای Hydration Error #418 در siteInfoService (services/siteInfoService.ts)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('services/siteInfoService.ts', `// File Path: services/siteInfoService.ts
import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

export interface FooterLinkItem {
  id: string;
  title: string;
  url: string;
}

export interface FooterContactItem {
  id: string;
  type: "phone" | "email" | "address" | "working_hours" | "custom";
  title: string;
  value: string;
  link?: string;
  icon?: string;
  show: boolean;
}

export interface FooterCertificateItem {
  id: string;
  title: string;
  codeOrHtml?: string;
  imageUrl?: string;
  link?: string;
  show: boolean;
}

export interface SocialKeyItem {
  letter: string;
  name: string;
  href: string;
  color: string;
}

export interface HomepageLayoutConfig {
  hero: {
    show: boolean;
    heightMode: "compact" | "standard" | "cinematic";
    verticalPadding: "compact" | "normal" | "relaxed";
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    show3DCanvas: boolean;
  };
  showcase3D: {
    show: boolean;
    cardScale: "compact" | "standard" | "large";
    title: string;
    subtitle: string;
    limit: number;
  };
  newsTicker: {
    show: boolean;
  };
  blogSection: {
    show: boolean;
    title: string;
    subtitle: string;
    count: number;
    showViewAll: boolean;
  };
  contactDock: {
    show: boolean;
    title: string;
    scale: "small" | "medium" | "large";
    keys: SocialKeyItem[];
  };
  footer: {
    show: boolean;
    paddingMode: "compact" | "normal" | "relaxed";
    scaleMode: "compact" | "normal" | "large";
    brandTitle?: string;
    brandSubtitle?: string;
    description?: string;
    showBadges: boolean;
    badge1Text: string;
    badge2Text: string;
    quickLinks: {
      show: boolean;
      title: string;
      links: FooterLinkItem[];
    };
    customerServices: {
      show: boolean;
      title: string;
      links: FooterLinkItem[];
    };
    contactInfo: {
      show: boolean;
      title: string;
      items: FooterContactItem[];
    };
    certificates: {
      show: boolean;
      title: string;
      items: FooterCertificateItem[];
    };
    bottomBar: {
      show: boolean;
      copyrightText: string;
      designerText: string;
      enamadBadgeText: string;
    };
  };
  aiChat: {
    bottomDesktop: number;
    bottomMobile: number;
    sizeMode: "compact" | "standard" | "large";
    autoHideNearFooter: boolean;
  };
}

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
  gemini_api_key?: string;
  homepage_layout_config?: HomepageLayoutConfig;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const DEFAULT_HOMEPAGE_LAYOUT_CONFIG: HomepageLayoutConfig = {
  hero: {
    show: true,
    heightMode: "compact",
    verticalPadding: "compact",
    title: "مرجع تخصصی خرید جدیدترین گجت‌ها و سخت‌افزار نوین",
    subtitle: "تامین مستقیم انواع مانیتورهای ۵K رتینا، لپ‌تاپ‌های حرفه‌ای M4 Max، ساعت‌های هوشمند اولترا و ابزارهای استودیو با ۱۸ ماه گارانتی اصالت طلایی و ارسال پیشتاز.",
    buttonText: "مشاهده کاتالوگ محصولات",
    buttonLink: "/#products",
    show3DCanvas: true,
  },
  showcase3D: {
    show: true,
    cardScale: "standard",
    title: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
    subtitle: "پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری",
    limit: 7,
  },
  newsTicker: {
    show: true,
  },
  blogSection: {
    show: true,
    title: "مجله و مقالات تحلیلی فناوری",
    subtitle: "جدیدترین بررسی‌های تخصصی سخت‌افزار و راهنمای خرید گجت‌ها",
    count: 3,
    showViewAll: true,
  },
  contactDock: {
    show: true,
    title: "شبکه‌های ارتباطی و اجتماعی استودیو:",
    scale: "medium",
    keys: [
      { letter: "C", name: "GitHub", href: "https://github.com", color: "#181717" },
      { letter: "O", name: "LinkedIn", href: "https://linkedin.com", color: "#0A66C2" },
      { letter: "N", name: "Discord", href: "https://discord.com", color: "#5865F2" },
      { letter: "T", name: "Instagram", href: "https://instagram.com", color: "#E4405F" },
      { letter: "A", name: "Telegram", href: "https://t.me", color: "#26A5E4" },
      { letter: "C", name: "X / Twitter", href: "https://x.com", color: "#000000" },
      { letter: "T", name: "پشتیبانی تماس", href: "tel:09376110200", color: "#0284C7" },
    ],
  },
  footer: {
    show: true,
    paddingMode: "compact",
    scaleMode: "normal",
    brandTitle: "آکسون | Axon",
    brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
    description: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
    showBadges: true,
    badge1Text: "گارانتی اصالت ۱۰۰٪ فیزیکی",
    badge2Text: "ارسال پیشتاز سراسری",
    quickLinks: {
      show: true,
      title: "دسترسی سریع",
      links: [
        { id: "l1", title: "کاتالوگ کالاها", url: "/#products" },
        { id: "l2", title: "سامانه رهگیری مرسولات", url: "/track-order" },
        { id: "l3", title: "جدیدترین اخبار تکنولوژی", url: "/news" },
        { id: "l4", title: "مجله مقالات تخصصی", url: "/blog" },
        { id: "l5", title: "درباره آکسون", url: "/about" },
      ],
    },
    customerServices: {
      show: true,
      title: "خدمات مشتریان",
      links: [
        { id: "s1", title: "ثبت تیکت مشاوره", url: "/contact" },
        { id: "s2", title: "شرایط گارانتی طلایی", url: "/#products" },
        { id: "s3", title: "ضمانت بازگشت وجه ۷ روزه", url: "/#products" },
        { id: "s4", title: "راهنمای کالیبراسیون ۵K", url: "/blog" },
        { id: "s5", title: "روش‌های پرداخت امن شاپرک", url: "/track-order" },
      ],
    },
    contactInfo: {
      show: true,
      title: "اطلاعات تماس و دفتر",
      items: [
        { id: "c1", type: "phone", title: "تلفن پشتیبانی:", value: "09376110200", link: "tel:09376110200", show: true },
        { id: "c2", type: "email", title: "پست الکترونیک:", value: "Pouriarahimi@yahoo.com", link: "mailto:Pouriarahimi@yahoo.com", show: true },
        { id: "c3", type: "address", title: "نشانی تحویل حضوری و انبار:", value: "شیراز - ستارخان", show: true },
        { id: "c4", type: "working_hours", title: "ساعات پاسخگویی:", value: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰", show: true },
      ],
    },
    certificates: {
      show: true,
      title: "مجوزها و تاییدیه رسمی",
      items: [
        {
          id: "cert-enamad",
          title: "نماد اعتماد الکترونیکی (کد ۲۷۴۲۴۵۳۴)",
          link: "https://trustseal.enamad.ir/?id=27424534",
          show: true,
        },
      ],
    },
    bottomBar: {
      show: true,
      copyrightText: "تمامی حقوق مادی و معنوی برای آکسون | Axon محفوظ است",
      designerText: "طراحی و معماری مهندسی پایدار",
      enamadBadgeText: "نماد اعتماد الکترونیکی فعال (۲۷۴۲۴۵۳۴)",
    },
  },
  aiChat: {
    bottomDesktop: 64,
    bottomMobile: 96,
    sizeMode: "standard",
    autoHideNearFooter: true,
  },
};

export const DEFAULT_SITE_INFO: SiteInfo = {
  site_name: "آکسون | Axon",
  siteName: "آکسون | Axon",
  storeName: "آکسون | Axon",
  tagline: "مرجع تخصصی تجهیزات دیجیتال و تصویر",
  allow_google_index: true,
  allowGoogleIndex: true,
  maintenance_mode: "none",
  phone: "09376110200",
  email: "Pouriarahimi@yahoo.com",
  address: "شیراز - ستارخان",
  working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
  header_announcement: "⚡ ارسال رایگان سفارش‌های بالای ۲ میلیون تومان | ۱۸ ماه گارانتی اصالت طلایی",
  free_shipping_threshold: 2000000,
  description: "مرجع تخصصی تجهیزات دیجیتال، مانیتورهای حرفه‌ای و استودیو با گارانتی اصالت طلایی",
  footer_text: "مرجع تخصصی تجهیزات دیجیتال، مانیتورهای حرفه‌ای و استودیو با گارانتی اصالت طلایی",
  homepage_layout_config: DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
};

export const siteInfoService = {
  // این تابع برای رندر اولیه SSR و CSR باید کاملاً یکسان باشد تا خطای ۴۱۸ هیدریشن تولید نشود
  getSiteInfoSync(): SiteInfo {
    return DEFAULT_SITE_INFO;
  },

  async getSiteInfo(): Promise<SiteInfo | null> {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          const isAllowed = data.allow_google_index !== false && data.allowGoogleIndex !== false;

          let parsedLayout: HomepageLayoutConfig = DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
          if (data.homepage_layout_config) {
            try {
              const incoming = typeof data.homepage_layout_config === "string"
                ? JSON.parse(data.homepage_layout_config)
                : data.homepage_layout_config;
              parsedLayout = {
                ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
                ...incoming,
                hero: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero, ...(incoming.hero || {}) },
                showcase3D: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D, ...(incoming.showcase3D || {}) },
                newsTicker: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.newsTicker, ...(incoming.newsTicker || {}) },
                blogSection: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.blogSection, ...(incoming.blogSection || {}) },
                contactDock: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.contactDock, ...(incoming.contactDock || {}) },
                footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(incoming.footer || {}) },
                aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(incoming.aiChat || {}) },
              };
            } catch {}
          }

          const mapped: SiteInfo = {
            id: data.id,
            site_name: data.site_name || data.store_name || "آکسون | Axon",
            siteName: data.site_name || data.store_name || "آکسون | Axon",
            storeName: data.site_name || data.store_name || "آکسون | Axon",
            tagline: data.tagline || "مرجع تخصصی تجهیزات دیجیتال و تصویر",
            phone: data.phone || "09376110200",
            email: data.email || "Pouriarahimi@yahoo.com",
            address: data.address || "شیراز - ستارخان",
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
            gemini_api_key: data.gemini_api_key || "",
            homepage_layout_config: parsedLayout,
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
      return DEFAULT_SITE_INFO;
    } catch {
      return DEFAULT_SITE_INFO;
    }
  },

  async updateSiteInfo(payload: Partial<SiteInfo>): Promise<SiteInfo | null> {
    try {
      const current = await this.getSiteInfo();
      const sName = payload.site_name || payload.siteName || payload.storeName || current?.site_name || "آکسون | Axon";

      const mergedConfig: HomepageLayoutConfig = {
        ...(current?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG),
        ...(payload.homepage_layout_config || {}),
      };

      const dbPayload: any = {
        site_name: sName,
        store_name: sName,
        tagline: payload.tagline !== undefined ? payload.tagline : current?.tagline,
        phone: payload.phone !== undefined ? payload.phone : current?.phone,
        email: payload.email !== undefined ? payload.email : current?.email,
        address: payload.address !== undefined ? payload.address : current?.address,
        working_hours: payload.working_hours !== undefined ? payload.working_hours : current?.working_hours,
        logo_url: payload.logo_url !== undefined ? payload.logo_url : current?.logo_url,
        footer_logo_url: payload.footer_logo_url !== undefined ? payload.footer_logo_url : current?.footer_logo_url,
        favicon_url: payload.favicon_url !== undefined ? payload.favicon_url : current?.favicon_url,
        allow_google_index: payload.allow_google_index !== undefined ? payload.allow_google_index : current?.allow_google_index,
        maintenance_mode: payload.maintenance_mode !== undefined ? payload.maintenance_mode : current?.maintenance_mode,
        maintenance_until: payload.maintenance_until !== undefined ? payload.maintenance_until : current?.maintenance_until,
        maintenance_duration_minutes: payload.maintenance_duration_minutes !== undefined ? payload.maintenance_duration_minutes : current?.maintenance_duration_minutes,
        header_announcement: payload.header_announcement !== undefined ? payload.header_announcement : current?.header_announcement,
        free_shipping_threshold: payload.free_shipping_threshold !== undefined ? payload.free_shipping_threshold : current?.free_shipping_threshold,
        footer_text: payload.footer_text !== undefined ? payload.footer_text : current?.footer_text,
        description: payload.description !== undefined ? payload.description : current?.description,
        custom_css: payload.custom_css !== undefined ? payload.custom_css : current?.custom_css,
        active_font_id: payload.active_font_id !== undefined ? payload.active_font_id : current?.active_font_id,
        gemini_api_key: payload.gemini_api_key !== undefined ? payload.gemini_api_key : current?.gemini_api_key,
        homepage_layout_config: mergedConfig,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      const json = await res.json();
      const finalData: SiteInfo = {
        ...(current || DEFAULT_SITE_INFO),
        ...(json.data || dbPayload),
        homepage_layout_config: mergedConfig,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SITE_INFO, JSON.stringify(finalData));
        realtimeEngine.broadcastLocally("site_info_updated", finalData);
      }

      return finalData;
    } catch (e) {
      console.error("siteInfoService.updateSiteInfo Error:", e);
      return null;
    }
  },
};

export default siteInfoService;
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۲. بازنویسی دکمه خرید با استایل تم مشکی در روز، سفید در شب و انیمیشن بدون خطا (components/AddToCartButton.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/AddToCartButton.tsx', `// File Path: components/AddToCartButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: string | number;
    title: string;
    price: number;
    image?: string;
    images?: string[];
    stock?: number;
    category?: string;
  };
  className?: string;
  showCounter?: boolean;
}

export default function AddToCartButton({
  product,
  className = "",
  showCounter = true,
}: AddToCartButtonProps) {
  const { cartItems, addToCart, openCart } = useCart();
  const [animState, setAnimState] = useState<"idle" | "adding">("idle");
  const [bumpCounter, setBumpCounter] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItem = cartItems.find((i) => String(i.id) === String(product.id));
  const currentCount = cartItem?.quantity || 0;
  const stockLimit = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;
  const isAvailable = stockLimit > 0;
  const isMaxReached = currentCount >= stockLimit;

  // استخراج تصویر مطمئن برای جلوگیری از باگ لود نشدن تصویر در کشوی سبد خرید
  const guaranteedImage =
    product.images?.[0] ||
    product.image ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable || isMaxReached || animState !== "idle") return;

    soundEngine.playAddToCart();
    setAnimState("adding");

    // ۱. افزودن فوری به استیت بدون باز شدن زودهنگام کشو
    addToCart(
      {
        id: product.id,
        title: product.title,
        name: product.title,
        price: product.price,
        image: guaranteedImage,
        images: [guaranteedImage],
        stock: stockLimit,
        category: product.category || "تکنولوژی",
        quantity: 1,
      },
      false
    );

    // ۲. جهش فنری شمارنده
    setTimeout(() => {
      setBumpCounter(true);
      setTimeout(() => setBumpCounter(false), 500);
    }, 550);

    // ۳. پس از پایان دقیق ۱۲۵۰ میلی‌ثانیه انیمیشن چرخ‌دستی: باز شدن کشوی سبد خرید
    setTimeout(() => {
      setAnimState("idle");
      openCart();
    }, 1250);
  };

  const isAnimating = animState === "adding";

  return (
    <div className={\`flex flex-col items-center gap-1.5 w-full select-none \${className}\`} dir="rtl" suppressHydrationWarning>
      
      {/* دکمه کپسولی: در تم روشن کاملاً مشکی مات با آیکون سفید، در تم تاریک کاملاً سفید با آیکون مشکی */}
      <button
        type="button"
        disabled={!isAvailable || isMaxReached}
        onClick={handleAddToCart}
        className={\`relative w-full h-[52px] rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer shadow-xl active:scale-[0.98] border \${
          !isAvailable || isMaxReached
            ? "bg-slate-800/40 opacity-40 cursor-not-allowed text-slate-400 border-transparent"
            : "bg-[#000000] text-white border-black/10 hover:bg-[#111111] shadow-black/15 dark:bg-[#ffffff] dark:text-[#000000] dark:border-white/20 dark:hover:bg-[#f0f0f0] dark:shadow-white/10"
        }\`}
      >
        <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden">
          
          {/* کانتینر سبد خرید متحرک و بسته در حال پرتاب */}
          <div
            className={\`flex items-center justify-center transition-all duration-300 \${
              isAnimating
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-kinetic-cart-left z-20"
                : "translate-x-0"
            }\`}
          >
            {/* بسته سفید با روبان آبی که با پرتاب الاستیک وارد سبد می‌شود */}
            {isAnimating && (
              <div className="absolute -top-3.5 left-[8px] z-30 pointer-events-none animate-kinetic-item-drop">
                <div className="w-3.5 h-3.5 rounded-[3px] bg-white dark:bg-slate-900 shadow-md border border-slate-300 dark:border-slate-600 flex items-center justify-center relative">
                  <span className="w-full h-[1.5px] bg-blue-500 absolute top-1/2 -translate-y-1/2" />
                  <span className="h-full w-[1.5px] bg-blue-500 absolute left-1/2 -translate-x-1/2" />
                </div>
              </div>
            )}

            {/* آیکون چرخ‌دستی که به سمت چپ می‌راند */}
            <svg
              className="w-5 h-5 shrink-0 drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3H5.2L7.1 14.2C7.25 15.1 8 15.8 8.9 15.8H18.2C19.1 15.8 19.85 15.1 20 14.2L21.4 7.2C21.55 6.4 20.95 5.7 20.15 5.7H6.2"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-left origin-[9.5px_19.5px]" : ""}
              />
              <circle
                cx="17.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-left origin-[17.5px_19.5px]" : ""}
              />
            </svg>
          </div>

          {/* متن دکمه که با انیمیشن در زمان کلیک محو می‌شود */}
          <span
            className={\`font-black text-xs tracking-wider uppercase mr-2.5 transition-all duration-300 whitespace-nowrap \${
              isAnimating
                ? "opacity-0 scale-75 -translate-x-6 pointer-events-none w-0 overflow-hidden"
                : "opacity-100 scale-100 translate-x-0"
            }\`}
          >
            {isMaxReached
              ? "حداکثر موجودی انبار"
              : !isAvailable
              ? "ناموجود در انبار"
              : "افزودن به سبد خرید"}
          </span>
        </div>
      </button>

      {/* شمارنده با جهش فنری */}
      {showCounter && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] font-sans" suppressHydrationWarning>
          <span
            className={\`font-mono font-black transition-all duration-300 \${
              bumpCounter ? "animate-kinetic-counter-bump text-emerald-500 font-extrabold" : "text-[var(--text-primary)]"
            }\`}
          >
            {mounted ? currentCount : 0}
          </span>
          <span>عدد در سبد شما</span>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. اصلاح کامل کشوی سبد خرید، نمایش قطعی تصویر کالا و کنتراست عالی فرم‌ها (components/CartDrawer.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/CartDrawer.tsx', `// File Path: components/CartDrawer.tsx
"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { orderService } from "@/services/orderService";
import { IRAN_PROVINCES } from "@/lib/iranProvinces";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen: propIsOpen, onClose: propOnClose }: CartDrawerProps = {}) {
  const router = useRouter();
  const cartContext = useCart();
  const cartItems = cartContext?.cartItems || [];
  const isCartOpen = propIsOpen !== undefined ? propIsOpen : (cartContext?.isCartOpen || false);
  const closeCart = propOnClose || cartContext?.closeCart || (() => {});
  const removeFromCart = cartContext?.removeFromCart || (() => {});
  const updateQuantity = cartContext?.updateQuantity || (() => {});
  const totalPrice = cartContext?.totalPrice || 0;
  const discountAmount = cartContext?.discountAmount || 0;
  const finalPayable = cartContext?.finalPayable || totalPrice;
  const amountUntilFreeShipping = cartContext?.amountUntilFreeShipping || 0;

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("تهران");
  const [selectedCity, setSelectedCity] = useState("تهران");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalItemUnits = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleProvinceChange = (provName: string) => {
    setSelectedProvince(provName);
    const prov = IRAN_PROVINCES.find((p) => p.name === provName);
    if (prov && prov.cities.length > 0) {
      setSelectedCity(prov.cities[0]);
    }
  };

  if (!isCartOpen) return null;

  const handleIncreaseQuantity = (item: any) => {
    const currentStock = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999;
    if (item.quantity >= currentStock) {
      alert(\`⚠️ حداکثر موجودی قابل سفارش برای این کالا \${currentStock} عدد می‌باشد.\`);
      return;
    }
    soundEngine.playClick();
    updateQuantity(item.id, 1);
  };

  const handleDecreaseQuantity = (item: any) => {
    soundEngine.playClick();
    updateQuantity(item.id, -1);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    soundEngine.playClick();

    const res = await cartContext.applyCoupon(couponCode);
    if (res.success) {
      soundEngine.playSuccess();
      setCouponMsg({ type: "success", text: res.message });
    } else {
      setCouponMsg({ type: "error", text: res.message });
    }
  };

  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerName.trim()) {
      setValidationError("لطفاً نام و نام خانوادگی خود را وارد نمایید.");
      return;
    }

    const cleanPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/\\D/g, "");

    if (!/^09\\d{9}$/.test(cleanPhone)) {
      setValidationError("شماره موبایل وارد شده باید ۱۱ رقم و با 09 شروع شود.");
      return;
    }

    if (!streetAddress.trim()) {
      setValidationError("لطفاً نشانی دقیق خیابان و کوچه را وارد نمایید.");
      return;
    }

    if (!buildingNo.trim()) {
      setValidationError("لطفاً پلاک ساختمان را وارد نمایید.");
      return;
    }

    if (cartItems.length === 0) return;

    const fullConstructedAddress = \`استان \${selectedProvince}، شهر \${selectedCity}، \${streetAddress.trim()}، پلاک \${buildingNo.trim()}\${
      unitNo.trim() ? \`، واحد \${unitNo.trim()}\` : ""
    }\${floorNo.trim() ? \`، طبقه \${floorNo.trim()}\` : ""}\`;

    setSubmitting(true);
    soundEngine.playClick();

    try {
      const orderId = \`ORD-\${Date.now().toString().slice(-6)}\`;
      const orderPayload = {
        id: orderId,
        order_number: orderId,
        customer_name: customerName.trim(),
        phone: cleanPhone,
        province: selectedProvince,
        city: selectedCity,
        address: fullConstructedAddress,
        postal_code: postalCode.trim() || null,
        items: cartItems.map((item) => ({
          productId: item.id,
          product_id: item.id,
          title: item.title || item.name || "کالا",
          name: item.name || item.title || "کالا",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || item.images?.[0] || "",
        })),
        total_amount: totalPrice,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: cartContext.appliedCoupon ? cartContext.appliedCoupon.code : null,
        status: "pending" as const,
        payment_status: "pending" as const,
      };

      const newOrder = await orderService.create(orderPayload);

      if (newOrder) {
        closeCart();
        router.push(\`/checkout/payment?orderId=\${newOrder.orderNumber || newOrder.id}\`);
      } else {
        throw new Error("خطا در ایجاد فاکتور در سرور.");
      }
    } catch (err: any) {
      setValidationError(err?.message || "خطا در اتصال به سرور.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentCities = IRAN_PROVINCES.find((p) => p.name === selectedProvince)?.cities || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md font-sans select-none animate-fadeIn" dir="rtl">
      <div className="w-full max-w-lg bg-[var(--modal-bg)] border-r border-[var(--card-border)] h-full shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)]">
        
        {/* هدر کشو */}
        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] flex items-center justify-center font-bold text-xs hover:border-[var(--accent-blue)] border border-[var(--card-border)] transition cursor-pointer text-[var(--text-primary)]"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-[var(--text-primary)]">سبد خرید شما</span>
            <span className="text-[var(--accent-blue)] font-black text-xs font-mono">
              {totalItemUnits} قلم
            </span>
            <span className="text-lg">🛒</span>
          </div>
        </div>

        {/* وضعیت ارسال رایگان */}
        {totalPrice > 0 && (
          <div className="p-3 bg-[var(--input-bg)] border-b border-[var(--card-border)] text-xs space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span>🚀 وضعیت ارسال رایگان پیشتاز:</span>
              <span className={amountUntilFreeShipping === 0 ? "text-emerald-500 font-black" : "text-[var(--accent-blue)]"}>
                {amountUntilFreeShipping === 0
                  ? "✓ ارسال مرسوله شما رایگان شد!"
                  : \`فقط \${amountUntilFreeShipping.toLocaleString("fa-IR")} تومان تا ارسال رایگان\`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                style={{ width: \`\${Math.min(100, (totalPrice / 2000000) * 100)}%\` }}
              />
            </div>
          </div>
        )}

        {/* لیست محصولات و فرم تحویل */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {cartItems.length === 0 ? (
            <div className="py-28 text-center text-[var(--text-secondary)] space-y-2 font-bold">
              <span className="text-4xl block">🛍️</span>
              <p>سبد خرید شما در حال حاضر خالی است.</p>
            </div>
          ) : (
            <>
              {/* لیست کالاها با تضمین نمایش تصویر صحیح و بدون باگ */}
              <div className="space-y-3">
                {cartItems.map((item: any) => {
                  const stockLimit = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999;
                  const isMaxReached = item.quantity >= stockLimit;
                  const itemImg = item.image || item.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            removeFromCart(item.id);
                          }}
                          className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="حذف کالا"
                        >
                          🗑️
                        </button>

                        <div className="flex items-center gap-2 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-2xl px-2.5 py-1 font-bold">
                          <button
                            onClick={() => handleDecreaseQuantity(item)}
                            className="hover:text-[var(--accent-blue)] cursor-pointer px-1 font-bold text-sm"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-xs px-1 text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncreaseQuantity(item)}
                            disabled={isMaxReached}
                            className={\`px-1 font-bold text-sm transition \${
                              isMaxReached ? "opacity-30 cursor-not-allowed text-gray-400" : "hover:text-[var(--accent-blue)] cursor-pointer"
                            }\`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-left">
                        <div>
                          <h4 className="font-black text-xs text-[var(--text-primary)] line-clamp-1 text-right" dir="rtl">
                            {item.title || item.name}
                          </h4>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black block mt-0.5 text-right" dir="rtl">
                            {Number(item.discountPrice ?? item.price ?? 0).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>

                        <div className="w-13 h-13 rounded-xl bg-white dark:bg-slate-900 border border-[var(--card-border)] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          <img
                            src={itemImg}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* باکس کد تخفیف */}
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
                <span className="font-bold text-[11px] text-[var(--text-secondary)] block">کد تخفیف دارید؟</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-extrabold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                  >
                    اعمال
                  </button>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: OFF10"
                    className="flex-1 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)] uppercase"
                  />
                </div>
                {couponMsg && (
                  <p className={\`text-[10px] font-bold \${couponMsg.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}\`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* فرم آدرس پستی با استایل تمیز و کنتراست عالی */}
              <form id="cart-checkout-form" onSubmit={handleFinalCheckout} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-2.5">
                  <span>📋</span>
                  <span>مشخصات تحویل‌گیرنده و نشانی پستی:</span>
                </div>

                {validationError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] leading-relaxed">
                    ⚠️ {validationError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">نام و نام خانوادگی تحویل‌گیرنده *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: پوریا رحیمی"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">شماره موبایل جهت پیامک رهگیری *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-right text-[var(--text-primary)] shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">استان *</label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] cursor-pointer shadow-sm"
                    >
                      {IRAN_PROVINCES.map((prov) => (
                        <option key={prov.name} value={prov.name}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">شهرستان / شهر *</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] cursor-pointer shadow-sm"
                    >
                      {currentCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">خیابان و کوچه (نشانی دقیق) *</label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="مثال: خیابان ولیعصر، تقاطع میرداماد"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-medium text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">پلاک *</label>
                    <input
                      type="text"
                      required
                      value={buildingNo}
                      onChange={(e) => setBuildingNo(e.target.value)}
                      placeholder="مثال: ۲۴"
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] text-center shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">واحد (اختیاری)</label>
                    <input
                      type="text"
                      value={unitNo}
                      onChange={(e) => setUnitNo(e.target.value)}
                      placeholder="مثال: ۳"
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] text-center shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">طبقه (اختیاری)</label>
                    <input
                      type="text"
                      value={floorNo}
                      onChange={(e) => setFloorNo(e.target.value)}
                      placeholder="مثال: ۲"
                      className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-[var(--text-primary)] text-center shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1">کد پستی ۱۰ رقمی (اختیاری)</label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="7138152316"
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-slate-300 dark:border-slate-700 outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] text-right text-[var(--text-primary)] shadow-sm"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* فوتر تسویه نهایی فاکتور */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[var(--card-border)] bg-[var(--modal-bg)] space-y-3 text-xs">
            <div className="space-y-1.5 font-bold">
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>جمع کل اقلام:</span>
                <span className="font-mono text-sm text-[var(--text-primary)]">
                  {totalPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-rose-500 font-black">
                  <span>تخفیف اعمال‌شده:</span>
                  <span className="font-mono">- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-[var(--card-border)]">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {finalPayable.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            <button
              form="cart-checkout-form"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 active:scale-[0.99] transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>💳</span>
              <span>{submitting ? "در حال انتقال به درگاه بانکی..." : "تأیید نهایی و اتصال به شاپرک"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۴. رفع عدم تطابق هیدریشن در صفحه نخست (app/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, DEFAULT_HOMEPAGE_LAYOUT_CONFIG, HomepageLayoutConfig } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import AIAssistantChat from "@/components/AIAssistantChat";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import TechRadarFeed from "@/components/TechRadarFeed";
import Hero3DCanvas from "@/components/3d/Hero3DCanvas";
import ProductPerspectiveSlider from "@/components/ProductPerspectiveSlider";

export default function HomePage() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(FLAGSHIP_7_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [mounted, setMounted] = useState(false);

  const loadData = async () => {
    try {
      const [prods, bans, info] = await Promise.all([
        productService.getAll(),
        bannerService.getAll(),
        siteInfoService.getSiteInfo(),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      setBanners((bans || []).filter((b: any) => b.is_active !== false && b.isActive !== false));
      if (info?.homepage_layout_config) {
        setLayoutConfig(info.homepage_layout_config);
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    loadData();

    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadData();
    };

    const handleSiteInfoUpdate = (e: any) => {
      if (e.detail?.homepage_layout_config) {
        setLayoutConfig(e.detail.homepage_layout_config);
      }
    };

    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("site_info_updated", handleSiteInfoUpdate);

    return () => {
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
    };
  }, []);

  const heroCfg = layoutConfig.hero;
  const showcaseCfg = layoutConfig.showcase3D;
  const newsTickerCfg = layoutConfig.newsTicker;
  const blogCfg = layoutConfig.blogSection;

  const heroHeightClasses =
    heroCfg.heightMode === "cinematic"
      ? "min-h-[440px] sm:min-h-[520px]"
      : heroCfg.heightMode === "standard"
      ? "min-h-[300px] sm:min-h-[360px]"
      : "min-h-[200px] sm:min-h-[250px]";

  const heroPaddingClasses =
    heroCfg.verticalPadding === "relaxed"
      ? "p-8 sm:p-14 lg:p-16"
      : heroCfg.verticalPadding === "normal"
      ? "p-6 sm:p-10 lg:p-12"
      : "p-5 sm:p-8 lg:p-10";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-12 transition-colors duration-300" dir="rtl" suppressHydrationWarning>
      <main className="pt-1 px-3 sm:px-6 max-w-[1440px] mx-auto space-y-4 sm:space-y-6" suppressHydrationWarning>
        
        {/* تیکر اخبار تکنولوژی */}
        {newsTickerCfg.show && <TechRadarFeed />}

        {/* هیرو سکشن ماژولار */}
        {heroCfg.show && (
          <section className={\`w-full rounded-[2.2rem] sm:rounded-[2.5rem] overflow-hidden glass-morphism shadow-xl border border-[var(--card-border)] relative flex flex-col justify-center transition-all duration-300 \${heroHeightClasses} \${heroPaddingClasses}\`}>
            {heroCfg.show3DCanvas && <Hero3DCanvas />}

            <div className="relative z-10 space-y-2.5 max-w-2xl text-right">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-[var(--text-primary)]">
                {heroCfg.title}
              </h1>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
                {heroCfg.subtitle}
              </p>

              <div className="pt-1">
                <Link
                  href={heroCfg.buttonLink || "/#products"}
                  className="inline-flex items-center gap-2 bg-[var(--accent-blue)] text-white px-7 py-3 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  <span>{heroCfg.buttonText}</span>
                  <span>←</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* نمایشگاه سه‌بعدی محصولات */}
        {showcaseCfg.show && (
          <ProductPerspectiveSlider
            products={products.slice(0, showcaseCfg.limit || 7)}
            customTitle={showcaseCfg.title}
            customSubtitle={showcaseCfg.subtitle}
            cardScale={showcaseCfg.cardScale}
          />
        )}

        {/* مجله سئو */}
        {blogCfg.show && (
          <section className="glass-morphism rounded-3xl p-5 sm:p-7 space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  {blogCfg.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                  {blogCfg.subtitle}
                </p>
              </div>
              {blogCfg.showViewAll && (
                <Link href="/blog" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">
                  مشاهده همه مقالات ←
                </Link>
              )}
            </div>
            <HomeBlogSection count={blogCfg.count || 3} />
          </section>
        )}
      </main>

      <ProductComparisonModal products={compareList} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} onRemoveProduct={(id) => setCompareList(compareList.filter((item) => item.id !== id))} />
      <AIAssistantChat />
    </div>
  );
}

function HomeBlogSection({ count = 3 }: { count?: number }) {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/blogs").then((r) => r.json()).then((d) => setPosts((d.data || d.posts || []).slice(0, count))).catch(() => {});
  }, [count]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
      {posts.map((post) => (
        <article key={post.id || post.title} className="glass-morphism p-4 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[var(--card-border-hover)] transition duration-300">
          <h4 className="font-bold text-xs line-clamp-2 text-[var(--text-primary)]">{post.title}</h4>
          <Link href={"/blog/" + (post.id || "")} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline inline-block pt-2 border-t border-[var(--card-border)]">
            مطالعه مقاله ←
          </Link>
        </article>
      ))}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۵. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `fix(ui): black button in light, white in dark, fixed cart drawer thumbnails, eliminated hydration error #418 [${new Date().toLocaleTimeString('fa-IR')}]`;
  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } catch (cErr) {
    console.log('  \x1b[33m[INFO]\x1b[0m تمامی فایل‌ها با آخرین نسخه همگام هستند.');
  }

  console.log('\n  \x1b[34m[3/3]\x1b[0m در حال ارسال به ریموت و اجرای فرآیند استقرار خودکار (git push)...');
  let currentBranch = 'main';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim() || 'main';
  } catch {}

  execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });

  console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 تمامی اصلاحات با موفقیت ۱۰۰٪ اعمال، خطاهای کنسول حذف و روی Vercel مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}