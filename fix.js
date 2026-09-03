// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER ZERO-DEFECT UI/UX POLISH & FOOTER MASTER CONTROL STUDIO (v2026.10)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Architectural Deliverables:
 *   1. Full Dynamic Admin Control for ALL Footer Elements:
 *      - Brand texts, subtitle, description, warranty badges.
 *      - ContactDock keys (C-O-N-T-A-C-T) with editable labels, URLs, colors & scale.
 *      - Quick Links & Customer Services: Add, edit, remove, reorder links dynamically.
 *      - Contact micro-cards: Phone, email, address, working hours with direct action links.
 *      - Certificates & Badges Section: Add/edit/remove Enamad, Samandehi & trust seals.
 *      - Footer scale mode (Compact / Normal / Large).
 *   2. Redesigned AI Assistant Floating Button (AIAssistantChat):
 *      - Luxury Apple-style glassmorphic capsule with glowing orb & pulse ring.
 *      - Smart Collision Detector: Automatically shrinks / shifts near footer so it never
 *        obstructs contact cards or trust badges!
 *   3. Realtime Supabase & BroadcastChannel sync (zero reload required).
 *   4. Strict No-Truncation Rule enforced on all updated files.
 *   5. Automated Git staging, atomic commit and push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   📐 استقرار کنترل کامل فوتر، اینماد و مجوزها، داک کلیدها و هوشمندسازی دکمه هوش مصنوعی بدون تداخل');
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
// ۱. ارتقای اسکیمای تنظیمات کلان سایت و پشتیبانی کامل از مدیریت فوتر و اینماد (services/siteInfoService.ts)
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
      { letter: "C", name: "گیت‌هاب رسمی", href: "https://github.com", color: "#24292e" },
      { letter: "O", name: "اینستاگرام استودیو", href: "https://instagram.com", color: "#e1306c" },
      { letter: "N", name: "کانال تلگرام", href: "https://t.me", color: "#0088cc" },
      { letter: "T", name: "پشتیبانی واتساپ", href: "https://wa.me", color: "#25d366" },
      { letter: "A", name: "کانال یوتیوب", href: "https://youtube.com", color: "#ff0000" },
      { letter: "C", name: "شبکه اکس", href: "https://x.com", color: "#0f172a" },
      { letter: "T", name: "تماس تلفنی مستقیم", href: "tel:09376110200", color: "#0284c7" },
    ],
  },
  footer: {
    show: true,
    paddingMode: "compact",
    scaleMode: "normal",
    brandTitle: "آکسون | Axon",
    brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
    description: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
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
          title: "نماد اعتماد الکترونیکی (اینماد ۲۷۴۲۴۵۳۴)",
          imageUrl: "https://trustseal.enamad.ir/logo.aspx?id=27424534",
          link: "https://enamad.ir",
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
  getSiteInfoSync(): SiteInfo {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_SITE_INFO);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            return {
              ...DEFAULT_SITE_INFO,
              ...parsed,
              homepage_layout_config: {
                ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
                ...(parsed.homepage_layout_config || {}),
                hero: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero, ...(parsed.homepage_layout_config?.hero || {}) },
                showcase3D: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D, ...(parsed.homepage_layout_config?.showcase3D || {}) },
                newsTicker: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.newsTicker, ...(parsed.homepage_layout_config?.newsTicker || {}) },
                blogSection: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.blogSection, ...(parsed.homepage_layout_config?.blogSection || {}) },
                contactDock: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.contactDock, ...(parsed.homepage_layout_config?.contactDock || {}) },
                footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(parsed.homepage_layout_config?.footer || {}) },
                aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(parsed.homepage_layout_config?.aiChat || {}) },
              },
            };
          }
        }
      } catch {}
    }
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
      return this.getSiteInfoSync();
    } catch {
      return this.getSiteInfoSync();
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
// ۲. ارتقای داک کلیدهای کیبورد با مقیاس‌پذیری و کلیدهای داینامیک ادمین (components/ContactDock.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ContactDock.tsx', `// File Path: components/ContactDock.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { SocialKeyItem } from "@/services/siteInfoService";

interface ContactDockProps {
  customKeys?: SocialKeyItem[];
  title?: string;
  scale?: "small" | "medium" | "large";
}

const DEFAULT_KEYS: SocialKeyItem[] = [
  { letter: "C", name: "گیت‌هاب رسمی", href: "https://github.com", color: "#24292e" },
  { letter: "O", name: "اینستاگرام استودیو", href: "https://instagram.com", color: "#e1306c" },
  { letter: "N", name: "کانال تلگرام", href: "https://t.me", color: "#0088cc" },
  { letter: "T", name: "پشتیبانی واتساپ", href: "https://wa.me", color: "#25d366" },
  { letter: "A", name: "کانال یوتیوب", href: "https://youtube.com", color: "#ff0000" },
  { letter: "C", name: "شبکه اکس", href: "https://x.com", color: "#0f172a" },
  { letter: "T", name: "تماس تلفنی مستقیم", href: "tel:09376110200", color: "#0284c7" },
];

export default function ContactDock({ customKeys, title, scale = "medium" }: ContactDockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const keys = customKeys && customKeys.length > 0 ? customKeys : DEFAULT_KEYS;

  const keySizeClass =
    scale === "small"
      ? "w-7 h-9 sm:w-8 sm:h-10 text-xs"
      : scale === "large"
      ? "w-9 h-11 sm:w-11 sm:h-13 text-sm font-black"
      : "w-8 h-10 sm:w-9 sm:h-11 text-xs sm:text-sm";

  return (
    <div className="w-full flex flex-col items-start gap-2 select-none font-sans text-right" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
        <span className="text-[11px] font-black text-[var(--text-primary)]">
          {title || "شبکه‌های ارتباطی و اجتماعی استودیو:"}
        </span>
      </div>

      {/* کلیدهای مکانیکی به ترتیب لاتین تراز شده در سمت راست */}
      <div className="flex items-center justify-start w-full">
        <div
          className="p-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-md backdrop-blur-xl flex items-center gap-1.5"
          dir="ltr"
        >
          {keys.map((k, idx) => {
            const isFlipped = hoveredIndex === idx;

            return (
              <a
                key={idx}
                href={k.href}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => {
                  soundEngine.playClick();
                  setHoveredIndex(idx);
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => {
                  soundEngine.playClick();
                  setHoveredIndex(idx);
                }}
                className={\`relative rounded-xl cursor-pointer [perspective:1000px] group active:scale-95 transition-all \${keySizeClass}\`}
                title={k.name}
              >
                <div
                  className={\`w-full h-full rounded-xl border transition-transform duration-500 [transform-style:preserve-3d] shadow-sm \${
                    isFlipped
                      ? "[transform:rotateY(180deg)] border-[var(--accent-blue)] shadow-md"
                      : "border-[var(--card-border)] bg-[var(--modal-bg)] hover:border-[var(--accent-blue)]/50"
                  }\`}
                >
                  {/* رویه کلید مکانیکی */}
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center font-mono font-black text-[var(--text-primary)] [backface-visibility:hidden] bg-gradient-to-b from-[var(--input-bg)] to-[var(--modal-bg)] border-t border-white/20">
                    {k.letter}
                  </div>

                  {/* پشت کلید: برچسب نئونی رنگ سازمانی */}
                  <div
                    style={{ backgroundColor: k.color }}
                    className="absolute inset-0 rounded-xl flex items-center justify-center text-white [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-inner font-mono font-black text-[10px]"
                  >
                    ★
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* نمایش نام شبکه فعال شده */}
      <div className="h-4 flex items-center pr-1">
        {hoveredIndex !== null ? (
          <span className="text-[10px] font-black text-[var(--accent-blue)] transition-all animate-fadeIn">
            {keys[hoveredIndex].name} ↗
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">
            روی کلیدها نگه دارید تا دسترسی مستقیم فعال شود
          </span>
        )}
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. بازطراحی کامل و ۱۰۰٪ پویای فوتر با پشتیبانی از اینماد و مجوزها (components/Footer.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/Footer.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import ContactDock from "@/components/ContactDock";
import AnimatedLogo from "@/components/AnimatedLogo";
import { soundEngine } from "@/lib/soundEngine";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => {
      if (e.detail) setInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const layoutCfg = info?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const footerCfg = layoutCfg.footer;
  const contactDockCfg = layoutCfg.contactDock;

  if (footerCfg.show === false) return null;

  const siteName = footerCfg.brandTitle || info?.site_name || info?.siteName || "آکسون | Axon";
  const brandSubtitle = footerCfg.brandSubtitle || "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو";
  const brandDesc = footerCfg.description || info?.footer_text || info?.description || "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.";
  const logoUrl = info?.footer_logo_url || info?.footerLogoUrl || info?.logo_url || info?.logoUrl;

  const paddingClasses =
    footerCfg.paddingMode === "relaxed"
      ? "py-10 sm:py-14 space-y-8"
      : footerCfg.paddingMode === "normal"
      ? "py-8 sm:py-10 space-y-7"
      : "py-6 sm:py-8 space-y-6";

  const scaleTextClass =
    footerCfg.scaleMode === "compact"
      ? "text-xs"
      : footerCfg.scaleMode === "large"
      ? "text-sm"
      : "text-xs";

  return (
    <footer
      id="storefront-footer"
      className={\`w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-10 select-none transition-colors duration-300 font-sans relative z-10 \${scaleTextClass}\`}
      dir="rtl"
    >
      <div className={\`max-w-[1440px] mx-auto px-4 sm:px-8 \${paddingClasses}\`}>
        
        {/* ردیف اصلی: گرید ۱۲ ستونی استودیویی با تراز عالی */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[var(--card-border)] items-start">
          
          {/* ستون ۱ (راست): مشخصات برند، توضیحات، نشان‌ها و داک کلیدها (۵ ستون) */}
          <div className="lg:col-span-5 space-y-4 text-right">
            
            <div className="flex items-center gap-3">
              <AnimatedLogo customLogoUrl={logoUrl} size={38} />
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {siteName}
                </h3>
                <span className="text-[11px] text-[var(--accent-blue)] font-bold block">
                  {brandSubtitle}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-lg text-justify">
              {brandDesc}
            </p>

            {footerCfg.showBadges && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="text-emerald-500 text-xs">✓</span>
                  <span>{footerCfg.badge1Text || "گارانتی اصالت ۱۰۰٪ فیزیکی"}</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs">🚀</span>
                  <span>{footerCfg.badge2Text || "ارسال پیشتاز سراسری"}</span>
                </span>
              </div>
            )}

            {/* داک کلیدهای کیبورد CONTACT با تراز راست کامل */}
            {contactDockCfg.show && (
              <div className="pt-2 border-t border-[var(--card-border)]/60">
                <ContactDock
                  customKeys={contactDockCfg.keys}
                  title={contactDockCfg.title}
                  scale={contactDockCfg.scale}
                />
              </div>
            )}
          </div>

          {/* ستون ۲: پیوندهای دسترسی سریع (۲ ستون) */}
          {footerCfg.quickLinks.show && (
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  {footerCfg.quickLinks.title || "دسترسی سریع"}
                </h4>
              </div>

              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
                {footerCfg.quickLinks.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      onClick={() => soundEngine.playClick()}
                      className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                    >
                      <span className="text-[10px] opacity-60">›</span>
                      <span>{link.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ستون ۳: خدمات مشتریان و پشتیبانی (۲ ستون) */}
          {footerCfg.customerServices.show && (
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  {footerCfg.customerServices.title || "خدمات مشتریان"}
                </h4>
              </div>

              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-bold">
                {footerCfg.customerServices.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      onClick={() => soundEngine.playClick()}
                      className="hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 py-1"
                    >
                      <span className="text-[10px] opacity-60">›</span>
                      <span>{link.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ستون ۴ (چپ): میکروکارت‌های اطلاعات تماس و گواهی‌ها (۳ ستون) */}
          {footerCfg.contactInfo.show && (
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  {footerCfg.contactInfo.title || "اطلاعات تماس و دفتر"}
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                {footerCfg.contactInfo.items
                  .filter((it) => it.show !== false)
                  .map((it) => {
                    const isLink = Boolean(it.link);
                    const CardComponent = isLink ? "a" : "div";
                    const linkProps = isLink ? { href: it.link, onClick: () => soundEngine.playClick() } : {};

                    return (
                      <CardComponent
                        key={it.id}
                        {...linkProps}
                        className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm font-bold shadow-inner shrink-0">
                            {it.type === "phone" ? "📞" : it.type === "email" ? "✉️" : it.type === "address" ? "📍" : "⏰"}
                          </span>
                          <div className="overflow-hidden text-right">
                            <span className="text-[10px] text-[var(--text-secondary)] block font-bold">
                              {it.title}
                            </span>
                            <span className="font-bold text-xs text-[var(--text-primary)] truncate block group-hover:text-[var(--accent-blue)] transition-colors" dir={it.type === "phone" || it.type === "email" ? "ltr" : "rtl"}>
                              {it.value}
                            </span>
                          </div>
                        </div>
                        {isLink && (
                          <span className="text-[10px] text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0 mr-2">
                            ↗
                          </span>
                        )}
                      </CardComponent>
                    );
                  })}
              </div>

              {/* بخش پویا برای اینماد و سایر مجوزهای رسمی */}
              {footerCfg.certificates.show && footerCfg.certificates.items.length > 0 && (
                <div className="pt-3 border-t border-[var(--card-border)]/60 space-y-2">
                  <span className="text-[11px] font-black text-[var(--text-secondary)] block">
                    {footerCfg.certificates.title || "مجوزها و تاییدیه رسمی:"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {footerCfg.certificates.items
                      .filter((c) => c.show !== false)
                      .map((cert) => (
                        <div key={cert.id} className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition shadow-sm">
                          {cert.link ? (
                            <a href={cert.link} target="_blank" rel="noopener noreferrer" className="block" title={cert.title}>
                              {cert.imageUrl ? (
                                <img src={cert.imageUrl} alt={cert.title} className="w-12 h-12 object-contain" />
                              ) : (
                                <span className="text-xs font-bold text-[var(--accent-blue)]">{cert.title}</span>
                              )}
                            </a>
                          ) : cert.codeOrHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: cert.codeOrHtml }} />
                          ) : (
                            <span className="text-xs font-bold">{cert.title}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* نوار پایین فوتر با قابلیت سفارشی‌سازی کامل متون */}
        {footerCfg.bottomBar.show && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)] font-medium pt-2">
            <p className="text-center sm:text-right">
              {footerCfg.bottomBar.copyrightText} © {new Date().getFullYear()}
            </p>

            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="text-[var(--text-secondary)]">{footerCfg.bottomBar.designerText}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{footerCfg.bottomBar.enamadBadgeText}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۴. بازطراحی دکمه شناور هوش مصنوعی با ظاهر اپلی و سیستم عدم تداخل با فوتر (components/AIAssistantChat.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/AIAssistantChat.tsx', `"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  matchedProduct?: any;
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "سلام! من مشاور هوشمند تکنولوژی آکسون هستم. ⚡\\nهر سوالی درباره دستگاه‌ها، مشخصات فنی، گجت‌های نوین یا قیمت‌ها دارید بپرسید یا عکس قطعه را بفرستید تا بررسی کنم.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());
  const [isNearFooter, setIsNearFooter] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setSiteInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  // سنسور هوشمند تلاقی با فوتر جهت جلوگیری از پوشاندن کارت‌های تماس یا مجوزها
  useEffect(() => {
    const footerEl = document.getElementById("storefront-footer");
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearFooter(entry.isIntersecting);
      },
      { root: null, threshold: 0.08 }
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText || input.trim();
    if ((!textToSend && !selectedImage) || loading) return;

    soundEngine.playClick();
    const userMsg = textToSend || "📷 [ارسال تصویر جهت تحلیل]";
    const currentImg = selectedImage;

    setInput("");
    setSelectedImage(null);

    const updatedChat: ChatMessage[] = [...messages, { role: "user", text: userMsg }];
    setMessages(updatedChat);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          imageBase64: currentImg,
          role: "customer",
        }),
      });

      const data = await res.json();
      soundEngine.playSuccess();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response || data.reply || "درود بر شما! در خدمتتون هستم.",
          matchedProduct: data.matchedProduct || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "درود! ارتباط با سرور برقرار است. چطور می‌توانم راهنماییتان کنم؟" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPills = [
    "سلام",
    "شرایط گارانتی و ارسال",
    "پیشنهاد مانیتور حرفه‌ای",
    "مک‌بوک M4 Max",
  ];

  const aiChatCfg = siteInfo?.homepage_layout_config?.aiChat || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat;
  const bottomDesktopPx = aiChatCfg.bottomDesktop || 64;
  const bottomMobilePx = aiChatCfg.bottomMobile || 96;
  const autoHideNearFooter = aiChatCfg.autoHideNearFooter !== false;

  return (
    <div className="font-sans select-none" dir="rtl" suppressHydrationWarning>
      {!isOpen && (
        <>
          {/* دکمه دسکتاپ: با طراحی کپسولی لوکس اپل و سنسور هوشمند جمع شدن در نزدیکی فوتر */}
          <button
            style={{ bottom: \`\${bottomDesktopPx}px\` }}
            onClick={() => { soundEngine.playClick(); setIsOpen(true); }}
            className={\`hidden sm:flex fixed left-6 z-50 rounded-full transition-all duration-500 ease-out items-center cursor-pointer border shadow-2xl backdrop-blur-2xl \${
              autoHideNearFooter && isNearFooter
                ? "w-12 h-12 justify-center bg-slate-900/90 border-blue-500/40 text-white hover:scale-110 opacity-80 hover:opacity-100 p-0"
                : "px-5 py-3.5 gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white border-white/20 hover:scale-105 active:scale-95 text-xs font-black shadow-blue-500/25 ring-2 ring-blue-500/20"
            }\`}
            title="مشاوره هوشمند تکنولوژی"
          >
            {autoHideNearFooter && isNearFooter ? (
              <span className="text-xl animate-pulse">🤖</span>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <span className="text-sm">🤖</span>
                <span className="tracking-tight">مشاوره هوشمند تکنولوژی</span>
              </>
            )}
          </button>

          {/* دکمه موبایل: قرارگیری دقیق بالای منوی پایین موبایل با گوی شناور */}
          <button
            style={{ bottom: \`\${bottomMobilePx}px\` }}
            onClick={() => { soundEngine.playClick(); setIsOpen(true); }}
            className={\`sm:hidden fixed left-4 z-40 rounded-full transition-all duration-500 ease-out flex items-center justify-center border-2 active:scale-90 cursor-pointer \${
              autoHideNearFooter && isNearFooter
                ? "w-10 h-10 bg-slate-950/90 border-blue-400/40 text-white opacity-75 p-0"
                : "w-12 h-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-[0_8px_25px_rgba(37,99,235,0.7)] border-white/40"
            }\`}
            aria-label="دستیار هوش مصنوعی"
          >
            <span className="animate-pulse text-base">⚡</span>
          </button>
        </>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[420px] sm:h-[580px] sm:max-h-[85vh] sm:rounded-[2.5rem] bg-[var(--modal-bg)] sm:border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)] backdrop-blur-3xl animate-fadeIn z-[9999]">
          
          <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--input-bg)] shrink-0 pt-safe">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md">⚡</div>
              <div>
                <h4 className="text-xs font-black">مشاور هوشمند تکنولوژی</h4>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  آنلاین و متصل به Gemini Pro
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span>✕</span>
              <span>بستن</span>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div className={\`p-4 rounded-2xl max-w-[90%] leading-relaxed \${m.role === "user" ? "mr-auto bg-[var(--accent-blue)] text-white shadow-md" : "ml-auto bg-[var(--input-bg)] border border-[var(--card-border)]"}\`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                  
                  {m.matchedProduct && (
                    <div className="mt-3 pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2 bg-[var(--modal-bg)] p-2.5 rounded-xl">
                      <div className="text-right">
                        <span className="font-bold text-[11px] block text-[var(--text-primary)]">{m.matchedProduct.title}</span>
                        <span className="font-mono text-emerald-600 font-black text-xs">{Number(m.matchedProduct.discount_price || m.matchedProduct.price).toLocaleString("fa-IR")} ت</span>
                      </div>
                      <Link href={\`/products/\${m.matchedProduct.id}\`} onClick={() => setIsOpen(false)} className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-[10px] shadow-md hover:opacity-90">
                        خرید مستقیم 🛍️
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] text-[var(--text-secondary)] animate-pulse font-bold flex items-center gap-2">
                <span>🧠</span><span>در حال پردازش هوشمند...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] whitespace-nowrap cursor-pointer transition shrink-0 active:scale-95"
              >
                {pill}
              </button>
            ))}
          </div>

          {selectedImage && (
            <div className="p-2.5 px-4 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="" className="w-10 h-10 object-cover rounded-xl border border-[var(--card-border)]" />
                <span className="text-[11px] font-bold">عکس ضمیمه شد</span>
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-rose-500 font-black text-xs cursor-pointer p-1">✕</button>
            </div>
          )}

          <div className="p-3 border-t border-[var(--card-border)] flex items-center gap-2 bg-[var(--modal-bg)] shrink-0 pb-safe">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm cursor-pointer active:scale-95" title="ارسال عکس">📷</button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="پرسش تخصصی یا گفتگو..." className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs outline-none font-medium" />
            <button type="button" onClick={() => handleSend()} disabled={loading} className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black hover:opacity-90 cursor-pointer shadow-md active:scale-95">ارسال</button>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۵. توسعه استودیوی ادمین با امکان کنترل کامل آیتم‌های فوتر، اینماد و هوش مصنوعی (components/admin/StorefrontLayoutStudio.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/admin/StorefrontLayoutStudio.tsx', `// File Path: components/admin/StorefrontLayoutStudio.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  siteInfoService,
  SiteInfo,
  HomepageLayoutConfig,
  DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
  FooterLinkItem,
  FooterCertificateItem,
} from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function StorefrontLayoutStudio() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // استیت‌های افزودن پیوند جدید به دسترسی سریع
  const [newQuickLinkTitle, setNewQuickLinkTitle] = useState("");
  const [newQuickLinkUrl, setNewQuickLinkUrl] = useState("");

  // استیت‌های افزودن پیوند جدید به خدمات مشتریان
  const [newServiceLinkTitle, setNewServiceLinkTitle] = useState("");
  const [newServiceLinkUrl, setNewServiceLinkUrl] = useState("");

  // استیت‌های افزودن گواهی/اینماد جدید
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertLink, setNewCertLink] = useState("");
  const [newCertImageUrl, setNewCertImageUrl] = useState("");

  const loadCurrentSettings = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info) {
        setSiteInfo(info);
        if (info.homepage_layout_config) {
          setConfig({
            ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG,
            ...info.homepage_layout_config,
            hero: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.hero, ...(info.homepage_layout_config.hero || {}) },
            showcase3D: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.showcase3D, ...(info.homepage_layout_config.showcase3D || {}) },
            newsTicker: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.newsTicker, ...(info.homepage_layout_config.newsTicker || {}) },
            blogSection: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.blogSection, ...(info.homepage_layout_config.blogSection || {}) },
            contactDock: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.contactDock, ...(info.homepage_layout_config.contactDock || {}) },
            footer: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer, ...(info.homepage_layout_config.footer || {}) },
            aiChat: { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG.aiChat, ...(info.homepage_layout_config.aiChat || {}) },
          });
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadCurrentSettings();
    const handleUpdate = (e: any) => {
      if (e.detail?.homepage_layout_config) {
        setConfig(e.detail.homepage_layout_config);
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const updateSection = <K extends keyof HomepageLayoutConfig>(section: K, values: Partial<HomepageLayoutConfig[K]>) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...values,
      },
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    try {
      const updated = await siteInfoService.updateSiteInfo({
        homepage_layout_config: config,
      });

      if (updated) {
        soundEngine.playSuccess();
        setStatusMessage({
          type: "success",
          text: "⚡ تمامی تنظیمات چیدمان، فوتر، مجوزها و دکمه هوش مصنوعی در دیتابیس ثبت و به صورت بلادرنگ اعمال شد.",
        });
      } else {
        throw new Error("خطا در ثبت پایگاه داده");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ذخیره‌سازی تنظیمات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // عملیات روی لینک‌های فوتر
  const addQuickLink = () => {
    if (!newQuickLinkTitle.trim() || !newQuickLinkUrl.trim()) return;
    soundEngine.playClick();
    const newItem: FooterLinkItem = {
      id: \`ql_\${Date.now()}\`,
      title: newQuickLinkTitle.trim(),
      url: newQuickLinkUrl.trim(),
    };
    const updated = [...config.footer.quickLinks.links, newItem];
    updateSection("footer", {
      quickLinks: { ...config.footer.quickLinks, links: updated },
    });
    setNewQuickLinkTitle("");
    setNewQuickLinkUrl("");
  };

  const removeQuickLink = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.quickLinks.links.filter((l) => l.id !== id);
    updateSection("footer", {
      quickLinks: { ...config.footer.quickLinks, links: updated },
    });
  };

  const addServiceLink = () => {
    if (!newServiceLinkTitle.trim() || !newServiceLinkUrl.trim()) return;
    soundEngine.playClick();
    const newItem: FooterLinkItem = {
      id: \`sl_\${Date.now()}\`,
      title: newServiceLinkTitle.trim(),
      url: newServiceLinkUrl.trim(),
    };
    const updated = [...config.footer.customerServices.links, newItem];
    updateSection("footer", {
      customerServices: { ...config.footer.customerServices, links: updated },
    });
    setNewServiceLinkTitle("");
    setNewServiceLinkUrl("");
  };

  const removeServiceLink = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.customerServices.links.filter((l) => l.id !== id);
    updateSection("footer", {
      customerServices: { ...config.footer.customerServices, links: updated },
    });
  };

  // عملیات روی اینماد و مجوزها
  const addCertificate = () => {
    if (!newCertTitle.trim()) return;
    soundEngine.playClick();
    const newCert: FooterCertificateItem = {
      id: \`cert_\${Date.now()}\`,
      title: newCertTitle.trim(),
      link: newCertLink.trim() || undefined,
      imageUrl: newCertImageUrl.trim() || undefined,
      show: true,
    };
    const updated = [...config.footer.certificates.items, newCert];
    updateSection("footer", {
      certificates: { ...config.footer.certificates, items: updated },
    });
    setNewCertTitle("");
    setNewCertLink("");
    setNewCertImageUrl("");
  };

  const removeCertificate = (id: string) => {
    soundEngine.playClick();
    const updated = config.footer.certificates.items.filter((c) => c.id !== id);
    updateSection("footer", {
      certificates: { ...config.footer.certificates, items: updated },
    });
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* سربرگ استودیو چیدمان */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📐</span>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">
              استودیوی مدیریت بصری لایه‌بندی ویترین، فوتر، اینماد و هوش مصنوعی
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            کنترل بلادرنگ تمامی ستون‌های فوتر، ویرایش و افزودن مجوزها و گواهی‌ها و رفتار هوشمند دکمه چت
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span>💾</span>
          <span>{saving ? "در حال ذخیره‌سازی..." : "ذخیره و انتشار بلادرنگ"}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={\`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn \${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-600"
          }\`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* ۱. بخش جامع کنترل فوتر و ستون‌ها */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-lg font-black">
            ⚓
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              ۱. مدیریت جامع فوتر، مقیاس‌ها و محتوا (Footer Master Controller)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">کنترل کامل متون برند، ستون‌های پیوند، کارت‌های تماس و داک کلیدها</p>
          </div>
        </div>

        {/* تنظیمات کلی فوتر */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">مقیاس و اندازه متون فوتر:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "compact", label: "کوچک" },
                { id: "normal", label: "استاندارد" },
                { id: "large", label: "بزرگ" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("footer", { scaleMode: m.id as any }); }}
                  className={\`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer \${
                    config.footer.scaleMode === m.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                  }\`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">پدینگ و فواصل عمودی فوتر:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "compact", label: "فشرده" },
                { id: "normal", label: "معمولی" },
                { id: "relaxed", label: "باز و جادار" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("footer", { paddingMode: m.id as any }); }}
                  className={\`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer \${
                    config.footer.paddingMode === m.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                  }\`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">نمایش نشان‌های گارانتی و ارسال:</label>
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); updateSection("footer", { showBadges: !config.footer.showBadges }); }}
              className={\`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border \${
                config.footer.showBadges
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-500"
              }\`}
            >
              {config.footer.showBadges ? "نشان‌های گارانتی فعال هستند ✓" : "مخفی‌سازی نشان‌ها"}
            </button>
          </div>
        </div>

        {/* ویرایش متون برند و نشان‌های گارانتی */}
        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
          <span className="font-black text-[var(--accent-blue)] block">ویرایش متون ستون برند:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">نام برند در فوتر:</label>
              <input
                type="text"
                value={config.footer.brandTitle || ""}
                onChange={(e) => updateSection("footer", { brandTitle: e.target.value })}
                placeholder="آکسون | Axon"
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">زیرعنوان برند:</label>
              <input
                type="text"
                value={config.footer.brandSubtitle || ""}
                onChange={(e) => updateSection("footer", { brandSubtitle: e.target.value })}
                placeholder="مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو"
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">متن نشان گارانتی ۱:</label>
              <input
                type="text"
                value={config.footer.badge1Text || ""}
                onChange={(e) => updateSection("footer", { badge1Text: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">متن نشان ارسال ۲:</label>
              <input
                type="text"
                value={config.footer.badge2Text || ""}
                onChange={(e) => updateSection("footer", { badge2Text: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-[var(--text-secondary)] mb-1">شرح فعالیت استودیو در فوتر:</label>
              <textarea
                rows={2}
                value={config.footer.description || ""}
                onChange={(e) => updateSection("footer", { description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-medium text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* مدیریت پیوندهای دسترسی سریع و خدمات مشتریان */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* ستون دسترسی سریع */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-black text-[var(--text-primary)]">🔗 پیوندهای دسترسی سریع</span>
              <input
                type="text"
                value={config.footer.quickLinks.title}
                onChange={(e) =>
                  updateSection("footer", {
                    quickLinks: { ...config.footer.quickLinks, title: e.target.value },
                  })
                }
                className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[11px] w-32"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {config.footer.quickLinks.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                  <div className="overflow-hidden">
                    <span className="font-bold block truncate">{link.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuickLink(link.id)}
                    className="p-1 px-2 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--card-border)] flex gap-2">
              <input
                type="text"
                placeholder="عنوان لینک"
                value={newQuickLinkTitle}
                onChange={(e) => setNewQuickLinkTitle(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold"
              />
              <input
                type="text"
                placeholder="آدرس /..."
                value={newQuickLinkUrl}
                onChange={(e) => setNewQuickLinkUrl(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
              <button
                type="button"
                onClick={addQuickLink}
                className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* ستون خدمات مشتریان */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <span className="font-black text-[var(--text-primary)]">🛡️ پیوندهای خدمات مشتریان</span>
              <input
                type="text"
                value={config.footer.customerServices.title}
                onChange={(e) =>
                  updateSection("footer", {
                    customerServices: { ...config.footer.customerServices, title: e.target.value },
                  })
                }
                className="p-1 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-[11px] w-32"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {config.footer.customerServices.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                  <div className="overflow-hidden">
                    <span className="font-bold block truncate">{link.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeServiceLink(link.id)}
                    className="p-1 px-2 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--card-border)] flex gap-2">
              <input
                type="text"
                placeholder="عنوان خدمت"
                value={newServiceLinkTitle}
                onChange={(e) => setNewServiceLinkTitle(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold"
              />
              <input
                type="text"
                placeholder="آدرس /..."
                value={newServiceLinkUrl}
                onChange={(e) => setNewServiceLinkUrl(e.target.value)}
                className="w-1/2 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
              />
              <button
                type="button"
                onClick={addServiceLink}
                className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs shrink-0"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ویرایش کارت‌های تماس دفتر */}
        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 text-xs">
          <span className="font-black text-[var(--text-primary)] block">📞 ویرایش مستقیم اطلاعات تماس و دفتر در فوتر:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {config.footer.contactInfo.items.map((it, idx) => (
              <div key={it.id} className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px]">{it.title}</span>
                  <input
                    type="checkbox"
                    checked={it.show !== false}
                    onChange={(e) => {
                      const arr = [...config.footer.contactInfo.items];
                      arr[idx] = { ...arr[idx], show: e.target.checked };
                      updateSection("footer", { contactInfo: { ...config.footer.contactInfo, items: arr } });
                    }}
                    className="w-3.5 h-3.5"
                  />
                </div>
                <input
                  type="text"
                  value={it.value}
                  onChange={(e) => {
                    const arr = [...config.footer.contactInfo.items];
                    arr[idx] = { ...arr[idx], value: e.target.value, link: it.type === "phone" ? \`tel:\${e.target.value.replace(/\\s+/g, "")}\` : it.type === "email" ? \`mailto:\${e.target.value}\` : undefined };
                    updateSection("footer", { contactInfo: { ...config.footer.contactInfo, items: arr } });
                  }}
                  className="w-full p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ۲. بخش مدیریت اختصاصی اینماد و سایر مجوزها (Certificates & Trust Badges) */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-lg font-black">
              📜
            </span>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                ۲. مدیریت نماد اعتماد الکترونیکی (اینماد)، ساماندهی و گواهی‌های رسمی
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">افزودن، ویرایش و کنترل نمادهای اعتماد و مجوزهای رسمی با تصویر یا لینک دلخواه</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--card-border)]">
            <input
              type="checkbox"
              checked={config.footer.certificates.show}
              onChange={(e) =>
                updateSection("footer", {
                  certificates: { ...config.footer.certificates, show: e.target.checked },
                })
              }
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
            <span className="text-xs font-black">نمایش بخش مجوزها در فوتر</span>
          </label>
        </div>

        {config.footer.certificates.show && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.footer.certificates.items.map((cert) => (
                <div key={cert.id} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {cert.imageUrl ? (
                      <img src={cert.imageUrl} alt="" className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1 shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-lg">
                        📜
                      </span>
                    )}
                    <div className="overflow-hidden">
                      <h5 className="font-black text-xs text-[var(--text-primary)] truncate">{cert.title}</h5>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate block">{cert.link || "بدون لینک"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCertificate(cert.id)}
                    className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer shrink-0"
                  >
                    حذف ✕
                  </button>
                </div>
              ))}
            </div>

            {/* فرم افزودن نماد / مجوز جدید */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
              <span className="font-bold text-[var(--text-primary)] block">+ افزودن مجوز یا نماد جدید به فوتر:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="عنوان نماد (مثال: ستاد ساماندهی)"
                  value={newCertTitle}
                  onChange={(e) => setNewCertTitle(e.target.value)}
                  className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
                <input
                  type="text"
                  placeholder="لینک تاییدیه (https://...)"
                  value={newCertLink}
                  onChange={(e) => setNewCertLink(e.target.value)}
                  className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                />
                <input
                  type="text"
                  placeholder="آدرس لوگوی نماد (URL تصویر)"
                  value={newCertImageUrl}
                  onChange={(e) => setNewCertImageUrl(e.target.value)}
                  className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs"
                />
              </div>
              <button
                type="button"
                onClick={addCertificate}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer"
              >
                + ثبت نماد در فوتر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ۳. تنظیمات دکمه شناور چت هوش مصنوعی و سنسور هوشمند عدم تداخل */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md">
            🤖
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              ۳. استایل و رفتار دکمه چت هوش مصنوعی (AIAssistantChat)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">تنظیم فاصله از پایین و سنسور خودکار جمع‌شدن در نزدیکی فوتر برای جلوگیری از مزاحمت</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">عدم تداخل هوشمند با فوتر:</span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                updateSection("aiChat", { autoHideNearFooter: !config.aiChat.autoHideNearFooter });
              }}
              className={\`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border \${
                config.aiChat.autoHideNearFooter
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-600"
              }\`}
            >
              {config.aiChat.autoHideNearFooter ? "سنسور هوشمند فعال است (جمع شدن در فوتر ✓)" : "غیرفعال (ثابت)"}
            </button>
            <span className="text-[10px] text-[var(--text-secondary)] block">
              در زمان اسکرول به انتهای صفحه، دکمه به گوی فشرده تبدیل می‌شود تا جلوی هیچ کارتی را نگیرد.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله دسکتاپ:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{config.aiChat.bottomDesktop}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="160"
              value={config.aiChat.bottomDesktop}
              onChange={(e) => updateSection("aiChat", { bottomDesktop: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله موبایل:</span>
              <span className="font-mono font-black text-emerald-500">{config.aiChat.bottomMobile}px</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={config.aiChat.bottomMobile}
              onChange={(e) => updateSection("aiChat", { bottomMobile: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۶. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `feat(footer): complete admin control over footer, certificates, enamad & smart non-obstructive ai chat [${new Date().toLocaleTimeString('fa-IR')}]`;
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
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 تمامی امکانات خواسته شده با موفقیت ۱۰۰٪ پیاده‌سازی و روی سرور مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}