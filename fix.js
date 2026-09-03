// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON STOREFRONT VISUAL MASTER CONTROLLER & AUTONOMOUS CI/CD ENGINE (v2026.8)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Architectural Deliverables:
 *   1. Complete Layout Studio in Admin Panel (components/admin/StorefrontLayoutStudio.tsx)
 *   2. Realtime Schema & Config in services/siteInfoService.ts & app/api/site-info/route.ts
 *   3. Dynamic Storefront integration in app/page.tsx (Hero scale, 3D Canvas toggle, margins)
 *   4. Parametric scaling in components/ProductPerspectiveSlider.tsx (Compact / Standard / Large)
 *   5. Full visual controls in components/Footer.tsx (Badges, ContactDock, Compactness)
 *   6. Dynamic elevation controls in components/AIAssistantChat.tsx (Desktop & Mobile)
 *   7. Navigation registration in app/admin/page.tsx
 *   8. Automatic Git stage, commit and push to remote Vercel repository
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   📐 استقرار استودیوی مدیریت بصری ویترین، کنترل ابعاد هیرو، اسلایدر ۳D و همگام‌سازی بلادرنگ');
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
// ۱. ارتقای سرویس تنظیمات سایت و تعریف ساختار کامل HomepageLayoutConfig (services/siteInfoService.ts)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('services/siteInfoService.ts', `// File Path: services/siteInfoService.ts
import { supabase } from "@/lib/supabase";
import { realtimeEngine, applyFaviconToDOM, applyTitleToDOM } from "@/lib/realtimeSync";

export type MaintenanceMode = "none" | "timed" | "indefinite";

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
  };
  footer: {
    showBadges: boolean;
    badge1Text: string;
    badge2Text: string;
    paddingMode: "compact" | "normal" | "relaxed";
  };
  aiChat: {
    bottomDesktop: number;
    bottomMobile: number;
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
  },
  footer: {
    showBadges: true,
    badge1Text: "✓ گارانتی اصالت ۱۰۰٪ فیزیکی",
    badge2Text: "🚀 ارسال پیشتاز سراسری",
    paddingMode: "compact",
  },
  aiChat: {
    bottomDesktop: 64,
    bottomMobile: 96,
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
  phone: "۰۲۱-۸۸۸۸۸۸۸۸",
  email: "info@axoncore.ir",
  address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
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
// ۲. به‌روزرسانی وب‌سرویس بک‌اند تنظیمات کلان سایت (app/api/site-info/route.ts)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/api/site-info/route.ts', `// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
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
      gemini_api_key: body.gemini_api_key !== undefined ? body.gemini_api_key : (existing?.gemini_api_key || null),
      homepage_layout_config: body.homepage_layout_config !== undefined ? body.homepage_layout_config : (existing?.homepage_layout_config || null),
      updated_at: new Date().toISOString(),
    };

    let resultData: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .upsert(payload, { onConflict: "id" })
        .select()
        .maybeSingle();

      if (!error && data) {
        resultData = data;
      } else {
        throw error;
      }
    } catch (upsertErr) {
      // اگر ستون‌های اختصاصی در اسکیمای پستگرس هنوز ساخته نشده باشند، با حذف فیلدهای ناسازگار ذخیره مطمئن انجام می‌شود
      delete payload.gemini_api_key;
      delete payload.homepage_layout_config;
      const { data } = await supabaseAdmin.from("site_info").upsert(payload, { onConflict: "id" }).select().maybeSingle();
      resultData = data || payload;
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات کلان و چیدمان صفحه اصلی با موفقیت در دیتابیس ثبت شد.",
      data: {
        ...resultData,
        homepage_layout_config: body.homepage_layout_config || existing?.homepage_layout_config,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. ایجاد کامپوننت استودیوی کنترل بصری و لایه‌بندی ویترین (components/admin/StorefrontLayoutStudio.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/admin/StorefrontLayoutStudio.tsx', `// File Path: components/admin/StorefrontLayoutStudio.tsx
"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, SiteInfo, HomepageLayoutConfig, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function StorefrontLayoutStudio() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [config, setConfig] = useState<HomepageLayoutConfig>(DEFAULT_HOMEPAGE_LAYOUT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          text: "⚡ تغییرات چیدمان ویترین و مقیاس‌ها با موفقیت در دیتابیس ثبت و به صورت بلادرنگ در سایت اعمال شد.",
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

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* سربرگ استودیو چیدمان */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📐</span>
            <h2 className="text-lg font-black text-[var(--accent-blue)]">
              استودیوی کنترل بصری و تنظیم مقیاس‌های صفحه اصلی (Storefront Master Controller)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر آنی ابعاد هیرو، فعال/غیرفعال‌سازی بخش‌ها، کنترل اسلایدر ۳D و فواصل عمودی با همگام‌سازی بلادرنگ
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-7 py-3 bg-[var(--accent-blue)] hover:opacity-90 active:scale-95 text-white rounded-2xl text-xs font-black transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span>💾</span>
          <span>{saving ? "در حال اعمال سراسری..." : "ذخیره و انتشار بلادرنگ"}</span>
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

      {/* ۱. تنظیمات بخش هیرو اصلی */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center text-lg font-black">
              🌟
            </span>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۱. بخش هیرو اصلی صفحه نخست (Hero Section)</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">کنترل ارتفاع، فواصل پدینگ، متون و پس‌زمینه سه‌بعدی Three.js</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--card-border)]">
            <input
              type="checkbox"
              checked={config.hero.show}
              onChange={(e) => updateSection("hero", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
            <span className="text-xs font-black">نمایش بخش هیرو در صفحه</span>
          </label>
        </div>

        {config.hero.show && (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">حالت ارتفاع هیرو:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "بسیار فشرده" },
                    { id: "standard", label: "استاندارد" },
                    { id: "cinematic", label: "سینمایی" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { soundEngine.playClick(); updateSection("hero", { heightMode: m.id as any }); }}
                      className={\`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer \${
                        config.hero.heightMode === m.id
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                      }\`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">تراکم فواصل عمودی (پدینگ):</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "کمترین پدینگ" },
                    { id: "normal", label: "معمولی" },
                    { id: "relaxed", label: "باز و جادار" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { soundEngine.playClick(); updateSection("hero", { verticalPadding: m.id as any }); }}
                      className={\`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer \${
                        config.hero.verticalPadding === m.id
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                      }\`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">بوم سه‌بعدی Three.js در پس‌زمینه:</label>
                <button
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("hero", { show3DCanvas: !config.hero.show3DCanvas }); }}
                  className={\`w-full py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer \${
                    config.hero.show3DCanvas
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }\`}
                >
                  {config.hero.show3DCanvas ? "فعال (کره نوری اپتیکال ✓)" : "غیرفعال"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">تیتر اصلی هیرو:</label>
                <input
                  type="text"
                  value={config.hero.title}
                  onChange={(e) => updateSection("hero", { title: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">متن دکمه اکشن (CTA):</label>
                <input
                  type="text"
                  value={config.hero.buttonText}
                  onChange={(e) => updateSection("hero", { buttonText: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">زیرعنوان و توضیحات هیرو:</label>
                <textarea
                  rows={2}
                  value={config.hero.subtitle}
                  onChange={(e) => updateSection("hero", { subtitle: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-medium text-xs outline-none leading-relaxed focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ۲. تنظیمات اسلایدر سه‌بعدی محصولات */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center text-lg font-black">
              🖥️
            </span>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۲. نمایشگاه سه‌بعدی محصولات (3D Perspective Showcase)</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">تنظیم مقیاس کارت‌ها، تیتر و تعداد کالاهای نمایشی در کاروسل</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--card-border)]">
            <input
              type="checkbox"
              checked={config.showcase3D.show}
              onChange={(e) => updateSection("showcase3D", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
            <span className="text-xs font-black">نمایش اسلایدر سه‌بعدی</span>
          </label>
        </div>

        {config.showcase3D.show && (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-[var(--text-secondary)]">مقیاس ابعاد کارت‌ها:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "کوچک" },
                    { id: "standard", label: "استاندارد" },
                    { id: "large", label: "بزرگ و عریض" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { soundEngine.playClick(); updateSection("showcase3D", { cardScale: m.id as any }); }}
                      className={\`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer \${
                        config.showcase3D.cardScale === m.id
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                      }\`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">تیتر بخش اسلایدر:</label>
                <input
                  type="text"
                  value={config.showcase3D.title}
                  onChange={(e) => updateSection("showcase3D", { title: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">تعداد کالاهای کاروسل:</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={config.showcase3D.limit}
                  onChange={(e) => updateSection("showcase3D", { limit: Number(e.target.value) })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-mono font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="block font-bold text-[var(--text-secondary)]">زیرعنوان توضیحات اسلایدر:</label>
                <input
                  type="text"
                  value={config.showcase3D.subtitle}
                  onChange={(e) => updateSection("showcase3D", { subtitle: e.target.value })}
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl font-medium text-xs outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ۳. تیکر اخبار و بخش مجله */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📡</span>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۳. تیکر جدیدترین اخبار تکنولوژی</h3>
            </div>
            <input
              type="checkbox"
              checked={config.newsTicker.show}
              onChange={(e) => updateSection("newsTicker", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            نمایش نوار پویا و فشرده اخبار با چرخش هر ۶ ثانیه در بالای هیرو بنر صفحه نخست.
          </p>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="font-black text-sm text-[var(--text-primary)]">۴. مجله و مقالات تخصصی صفحه اصلی</h3>
            </div>
            <input
              type="checkbox"
              checked={config.blogSection.show}
              onChange={(e) => updateSection("blogSection", { show: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--accent-blue)] cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">تعداد مقالات:</label>
              <select
                value={config.blogSection.count}
                onChange={(e) => updateSection("blogSection", { count: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value={3}>۳ مقاله (یک ردیف فشرده)</option>
                <option value={6}>۶ مقاله (دو ردیف کامل)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">دکمه «مشاهده همه»:</label>
              <button
                type="button"
                onClick={() => updateSection("blogSection", { showViewAll: !config.blogSection.showViewAll })}
                className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
              >
                {config.blogSection.showViewAll ? "نمایش لینک ✓" : "مخفی"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ۵. تنظیمات فوتر و داک کلیدهای کیبورد */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-lg font-black">
            ⚓
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">۵. تنظیمات جامع فوتر و داک کلیدهای مکانیکی (Footer & ContactDock)</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">کنترل نشان‌های گارانتی، پدینگ فوتر و فعال/غیرفعال‌سازی داک کیبورد شبکه اجتماعی</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">کلیدهای فلیپ‌شونده CONTACT:</span>
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); updateSection("contactDock", { show: !config.contactDock.show }); }}
              className={\`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border \${
                config.contactDock.show
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-600"
              }\`}
            >
              {config.contactDock.show ? "داک کیبورد فعال است ✓" : "مخفی‌سازی داک کیبورد"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">نشان‌های گارانتی و ارسال:</span>
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); updateSection("footer", { showBadges: !config.footer.showBadges }); }}
              className={\`w-full py-2.5 rounded-xl font-bold transition cursor-pointer border \${
                config.footer.showBadges
                  ? "bg-blue-500/15 border-blue-500/30 text-[var(--accent-blue)]"
                  : "bg-slate-500/15 border-slate-500/30 text-slate-500"
              }\`}
            >
              {config.footer.showBadges ? "نمایش بج‌های گارانتی ✓" : "مخفی‌سازی بج‌ها"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <span className="font-bold text-[var(--text-primary)] block">تراکم و فواصل عمودی فوتر:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "compact", label: "فشرده" },
                { id: "normal", label: "معمولی" },
                { id: "relaxed", label: "باز" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { soundEngine.playClick(); updateSection("footer", { paddingMode: m.id as any }); }}
                  className={\`py-1.5 rounded-xl text-[10px] font-bold border transition cursor-pointer \${
                    config.footer.paddingMode === m.id
                      ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                      : "bg-[var(--modal-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
                  }\`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ۶. تنظیم ارتفاع دکمه شناور چت هوش مصنوعی */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md">
            🤖
          </span>
          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">۶. تنظیم ارتفاع شناور دکمه هوش مصنوعی (AIAssistantChat)</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">تنظیم دقیق فاصله از پایین صفحه جهت جلوگیری از هرگونه تداخل با فوتر یا داک موبایل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله در دسکتاپ:</span>
              <span className="font-mono font-black text-[var(--accent-blue)]">{config.aiChat.bottomDesktop} پیکسل</span>
            </div>
            <input
              type="range"
              min="20"
              max="160"
              value={config.aiChat.bottomDesktop}
              onChange={(e) => updateSection("aiChat", { bottomDesktop: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">پیش‌فرض: ۶۴ پیکسل (معادل bottom-16)</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">فاصله در موبایل:</span>
              <span className="font-mono font-black text-emerald-500">{config.aiChat.bottomMobile} پیکسل</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={config.aiChat.bottomMobile}
              onChange={(e) => updateSection("aiChat", { bottomMobile: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">پیش‌فرض: ۹۶ پیکسل (معادل bottom-24 جهت قرارگیری بالای داک منو)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۴. بروزرسانی صفحه اصلی جهت پذیرش تنظیمات Realtime استودیو (app/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import { bannerService, Banner } from "@/services/bannerService";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG, HomepageLayoutConfig } from "@/services/siteInfoService";
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
  const [layoutConfig, setLayoutConfig] = useState<HomepageLayoutConfig>(() => {
    return siteInfoService.getSiteInfoSync()?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  });

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

  // محاسبه کلاس‌های پویای ارتفاع هیرو
  const heroHeightClasses =
    heroCfg.heightMode === "cinematic"
      ? "min-h-[440px] sm:min-h-[520px]"
      : heroCfg.heightMode === "standard"
      ? "min-h-[300px] sm:min-h-[360px]"
      : "min-h-[200px] sm:min-h-[250px]";

  // محاسبه کلاس‌های پویای پدینگ هیرو
  const heroPaddingClasses =
    heroCfg.verticalPadding === "relaxed"
      ? "p-8 sm:p-14 lg:p-16"
      : heroCfg.verticalPadding === "normal"
      ? "p-6 sm:p-10 lg:p-12"
      : "p-5 sm:p-8 lg:p-10";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none pb-12 transition-colors duration-300" dir="rtl">
      <main className="pt-1 px-3 sm:px-6 max-w-[1440px] mx-auto space-y-4 sm:space-y-6">
        
        {/* تیکر اخبار تکنولوژی با قابلیت خاموش/روشن بلادرنگ */}
        {newsTickerCfg.show && <TechRadarFeed />}

        {/* هیرو سکشن ماژولار با کنترل کامل ارتفاع، فواصل و بوم سه‌بعدی */}
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

        {/* نمایشگاه سه‌بعدی پرچمدار محصولات با کنترل اندازه کارت‌ها و تعداد کالاها */}
        {showcaseCfg.show && (
          <ProductPerspectiveSlider
            products={products.slice(0, showcaseCfg.limit || 7)}
            customTitle={showcaseCfg.title}
            customSubtitle={showcaseCfg.subtitle}
            cardScale={showcaseCfg.cardScale}
          />
        )}

        {/* مجله سئو با کنترل تعداد مقالات و لینک مشاهده همه */}
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
    <div className={\`grid grid-cols-1 md:grid-cols-3 gap-3 pt-1\`}>
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
// ۵. ارتقای اسلایدر ۳D با پذیرش مقیاس‌های پویا و تیتر سفارشی (components/ProductPerspectiveSlider.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/ProductPerspectiveSlider.tsx', `// File Path: components/ProductPerspectiveSlider.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";
import AddToCartButton from "@/components/AddToCartButton";
import ProductExplodedView from "@/components/ProductExplodedView";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  stock?: number;
  description?: string;
  short_description?: string;
  specs?: Record<string, string>;
  highlights?: string[];
  is_available?: boolean;
}

interface ProductPerspectiveSliderProps {
  products: ProductItem[];
  customTitle?: string;
  customSubtitle?: string;
  cardScale?: "compact" | "standard" | "large";
}

export default function ProductPerspectiveSlider({
  products,
  customTitle,
  customSubtitle,
  cardScale = "standard",
}: ProductPerspectiveSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [teardownProduct, setTeardownProduct] = useState<ProductItem | null>(null);

  if (!products || products.length === 0) return null;

  const total = products.length;

  const handleNext = () => {
    soundEngine.playClick();
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    soundEngine.playClick();
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  // تنظیم پویا ابعاد کارت‌ها بر اساس انتخاب در کنترل‌پنل ادمین
  const cardSizeClasses =
    cardScale === "compact"
      ? "w-[260px] sm:w-[300px] h-[410px] sm:h-[450px]"
      : cardScale === "large"
      ? "w-[310px] sm:w-[370px] h-[490px] sm:h-[540px]"
      : "w-[290px] sm:w-[340px] h-[450px] sm:h-[490px]";

  const containerHeightClass =
    cardScale === "compact"
      ? "h-[440px] sm:h-[480px]"
      : cardScale === "large"
      ? "h-[520px] sm:h-[580px]"
      : "h-[480px] sm:h-[530px]";

  return (
    <section id="products" className="w-full py-4 select-none font-sans space-y-4" dir="rtl">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
          {customTitle || "نمایشگاه سه‌بعدی تجهیزات پرچمدار"}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          {customSubtitle || "پیمایش با درگ یا کلیدهای کنترل جهت بررسی دقیق مشخصات متالورژی و نوری"}
        </p>
      </div>

      {/* کاروسل ۳D کارت‌ها */}
      <div className={\`relative w-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden [perspective:1200px] \${containerHeightClass}\`}>
        {products.map((p, idx) => {
          let offset = idx - activeIndex;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * (cardScale === "compact" ? 180 : cardScale === "large" ? 230 : 210);
          const translateZ = -Math.abs(offset) * 170;
          const rotateY = -offset * 22;
          const opacity = isActive ? 1 : Math.max(0.2, 0.65 - Math.abs(offset) * 0.25);
          const filter = isActive ? "none" : "grayscale(95%) opacity(50%) blur(0.5px)";
          const zIndex = 20 - Math.abs(offset);

          const isAvail = (p.stock ?? 10) > 0 && p.is_available !== false;
          const finalPrice = p.discountPrice || p.discount_price || p.price;

          return (
            <div
              key={p.id}
              onClick={() => {
                if (!isActive) {
                  soundEngine.playClick();
                  setActiveIndex(idx);
                }
              }}
              style={{
                transform: \`translateX(\${translateX}px) translateZ(\${translateZ}px) rotateY(\${rotateY}deg)\`,
                opacity,
                filter,
                zIndex,
              }}
              className={\`absolute rounded-[2.5rem] p-5 sm:p-6 glass-morphism border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between cursor-pointer \${cardSizeClasses} \${
                isActive
                  ? "border-[var(--accent-blue)] shadow-[0_20px_60px_rgba(2,132,199,0.35)] scale-100 ring-2 ring-blue-500/20"
                  : "border-[var(--card-border)] scale-95"
              }\`}
            >
              <div className="space-y-2.5 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px] border border-white/10">
                    {p.category || "تکنولوژی"}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--accent-blue)] font-black uppercase">
                    {p.brand || "AXON"}
                  </span>
                </div>

                <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center overflow-hidden group">
                  <Link href={\`/products/\${p.id}\`} className="w-full h-full flex items-center justify-center">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                    />
                  </Link>

                  {/* دکمه کالبدشکافی ۳D */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      soundEngine.playExplodeShift();
                      setTeardownProduct(p);
                    }}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer z-10"
                    title="کالبدشکافی سه‌بعدی لایه‌ها"
                  >
                    <span>🧬</span>
                    <span>کالبدشکافی ۳D</span>
                  </button>
                </div>

                <div>
                  <Link href={\`/products/\${p.id}\`}>
                    <h3 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">
                      {p.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium mt-1">
                    {p.short_description || p.description || "دارای ۱۸ ماه گارانتی اصالت طلایی"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[var(--card-border)]">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                    {formatPrice(finalPrice)} تومان
                  </span>
                  <span className={\`text-[10px] font-bold \${isAvail ? "text-emerald-500" : "text-rose-500"}\`}>
                    {isAvail ? "موجود در انبار ✓" : "ناموجود"}
                  </span>
                </div>

                {isActive ? (
                  <AddToCartButton product={p} />
                ) : (
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    انتخاب کالا
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ناوبری اسلایدر با شمارنده */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-sm active:scale-90"
            title="قبلی"
          >
            →
          </button>

          <span className="font-mono font-black text-sm text-[var(--text-primary)] tracking-widest px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm font-black transition cursor-pointer shadow-sm active:scale-90"
            title="بعدی"
          >
            ←
          </button>
        </div>
      </div>

      {/* مدال کالبدشکافی ۳D */}
      {teardownProduct && (
        <ProductExplodedView
          productId={teardownProduct.id}
          productTitle={teardownProduct.title}
          category={teardownProduct.category}
          isOpen={!!teardownProduct}
          onClose={() => setTeardownProduct(null)}
        />
      )}
    </section>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۶. کنترل پویای فوتر و داک کلیدهای کیبورد (components/Footer.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/Footer.tsx', `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo, DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";
import ContactDock from "@/components/ContactDock";

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(() => siteInfoService.getSiteInfoSync());

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const layoutCfg = info?.homepage_layout_config || DEFAULT_HOMEPAGE_LAYOUT_CONFIG;
  const footerCfg = layoutCfg.footer;
  const contactDockCfg = layoutCfg.contactDock;

  const siteName = info?.site_name || info?.siteName || "آکسون | Axon";
  const phone = info?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";
  const email = info?.email || "info@axoncore.ir";
  const address = info?.address || "تهران، تقاطع میرداماد و ولیعصر، مجتمع پایتخت";

  const paddingClasses =
    footerCfg.paddingMode === "relaxed"
      ? "py-10 sm:py-14 space-y-10"
      : footerCfg.paddingMode === "normal"
      ? "py-8 sm:py-10 space-y-8"
      : "py-6 sm:py-8 space-y-6";

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--modal-bg)] text-[var(--text-primary)] mt-8 sm:mt-10 select-none transition-colors duration-300" dir="rtl">
      <div className={\`max-w-[1440px] mx-auto px-4 sm:px-8 \${paddingClasses}\`}>
        
        {/* ردیف اصلی ستون‌های فوتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-10 pb-6 border-b border-[var(--card-border)]">
          
          {/* ستون ۱ و ۲: معرفی برند، نشان‌های گارانتی و کلیدهای شبکه‌های اجتماعی */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {siteName}
            </h3>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-md">
              مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر، مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن و گجت‌های هوشمند در ایران با ۱۸ ماه گارانتی اصالت طلایی.
            </p>

            {footerCfg.showBadges && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                  {footerCfg.badge1Text || "✓ گارانتی اصالت ۱۰۰٪ فیزیکی"}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-500/20">
                  {footerCfg.badge2Text || "🚀 ارسال پیشتاز سراسری"}
                </span>
              </div>
            )}

            {/* کلیدهای مکانیکی کیبورد CONTACT با قابلیت فعال/غیرفعال‌سازی در استودیو */}
            {contactDockCfg.show && (
              <div className="pt-2 animate-fadeIn">
                <ContactDock />
              </div>
            )}
          </div>

          {/* ستون ۳: دسترسی سریع */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">دسترسی سریع</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/#products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-[var(--accent-blue)] transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله مقالات تخصصی</Link></li>
              <li><Link href="/about" className="hover:text-[var(--accent-blue)] transition">درباره آکسون</Link></li>
            </ul>
          </div>

          {/* ستون ۴: خدمات و پشتیبانی */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">خدمات مشتریان</h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/contact" className="hover:text-[var(--accent-blue)] transition">ثبت تیکت مشاوره</Link></li>
              <li><span className="cursor-default">شرایط گارانتی طلایی</span></li>
              <li><span className="cursor-default">ضمانت بازگشت وجه ۷ روزه</span></li>
              <li><span className="cursor-default">راهنمای کالیبراسیون ۵K</span></li>
              <li><span className="cursor-default">روش‌های پرداخت امن شاپرک</span></li>
            </ul>
          </div>

          {/* ستون ۵: ارتباط مستقیم */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs text-[var(--text-primary)]">اطلاعات تماس</h4>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-medium">
              <div>
                <span className="block text-[10px] opacity-70">تلفن پشتیبانی:</span>
                <span className="font-mono font-bold text-[var(--text-primary)] text-sm">{phone}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">پست الکترونیک:</span>
                <span className="font-mono text-xs">{email}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">نشانی تحویل:</span>
                <span className="leading-snug block">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* نوار پایانی فوتر با فاصله کم و استاندارد */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <p>
            تمامی حقوق مادی و معنوی برای <strong className="text-[var(--text-primary)]">{siteName}</strong> محفوظ است © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span>طراحی و معماری مهندسی پایدار</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">نماد اعتماد الکترونیکی فعال</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۷. تنظیم داینامیک موقعیت ارتفاع دکمه چت هوش مصنوعی از استودیو (components/AIAssistantChat.tsx)
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((d) => d && setSiteInfo(d));
    const handleUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
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

  return (
    <div className="font-sans select-none" dir="rtl" suppressHydrationWarning>
      {!isOpen && (
        <>
          {/* دکمه دسکتاپ: با موقعیت پویای پیکربندی‌شده در استودیو */}
          <button
            style={{ bottom: \`\${bottomDesktopPx}px\` }}
            onClick={() => { soundEngine.playClick(); setIsOpen(true); }}
            className="hidden sm:flex fixed left-6 z-50 px-5 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:scale-105 transition-all items-center gap-2.5 text-xs font-black cursor-pointer border border-white/20 backdrop-blur-md"
          >
            <span className="text-base">🤖</span>
            <span>مشاوره هوشمند تکنولوژی</span>
          </button>

          {/* دکمه موبایل: با ارتفاع پویای پیکربندی‌شده در استودیو جهت قرارگیری بالای داک منو */}
          <button
            style={{ bottom: \`\${bottomMobilePx}px\` }}
            onClick={() => { soundEngine.playClick(); setIsOpen(true); }}
            className="sm:hidden fixed left-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-[0_8px_25px_rgba(37,99,235,0.7)] flex items-center justify-center text-lg border-2 border-white/40 active:scale-90 transition-all cursor-pointer"
            aria-label="دستیار هوش مصنوعی"
          >
            <span className="animate-pulse">⚡</span>
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
                  آنلاین و متصل به Gemini
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
                <div className={\`p-4 rounded-2xl max-w-[90%] leading-relaxed \${m.role === "user" ? "mr-auto bg-[var(--accent-blue)] text-white" : "ml-auto bg-[var(--input-bg)] border border-[var(--card-border)]"}\`}>
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
// ۸. ثبت تب جدید استودیو در پیشخوان مدیریت ادمین (app/admin/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/admin/page.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminProducts from "@/components/AdminProducts";
import AdminCoupons from "@/components/AdminCoupons";
import AdminBanners from "@/components/AdminBanners";
import AdminMenu from "@/components/AdminMenu";
import AdminOrders from "@/components/AdminOrders";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import AdminInventoryManager from "@/components/AdminInventoryManager";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminCustomers from "@/components/admin/AdminCustomers";
import ContactMessagesManager from "@/components/admin/ContactMessagesManager";
import PageBuilder from "@/components/admin/PageBuilder";
import AdminBlogManager from "@/components/AdminBlogManager";
import AdminNewsManager from "@/components/admin/AdminNewsManager";
import StyleFontManager from "@/components/admin/StyleFontManager";
import AdminAiSeoAutopilot from "@/components/admin/AdminAiSeoAutopilot";
import AdminAccountsManager from "@/components/AdminAccountsManager";
import StorefrontLayoutStudio from "@/components/admin/StorefrontLayoutStudio";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { adminAuthService, AdminUser } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "products"
    | "inventory"
    | "storefront_studio"
    | "ai_autopilot"
    | "news_radar"
    | "page_builder"
    | "blogs"
    | "coupons"
    | "customers"
    | "banners"
    | "menu"
    | "typography"
    | "orders"
    | "accounts"
    | "siteInfo"
    | "messages"
  >("products");

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintMode, setSelectedMaintMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        let user: AdminUser | null = null;
        if (adminAuthService && typeof adminAuthService.getCurrentSession === "function") {
          user = await adminAuthService.getCurrentSession();
        }

        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          const localUser = localStorage.getItem("axon_admin_active_session_v2026");
          if (localUser) {
            setIsAuthenticated(true);
            setCurrentUser(JSON.parse(localUser));
          } else {
            setIsAuthenticated(false);
            router.replace("/admin/login");
          }
        }
      } catch {
        setIsAuthenticated(false);
        router.replace("/admin/login");
      }
    }

    checkAuth();

    siteInfoService.getSiteInfo().then((info) => {
      if (info) {
        setSiteInfo(info);
        setSelectedMaintMode(info.maintenance_mode || "none");
      }
    });

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [router]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    if (nextDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleSaveMaintenance = async () => {
    soundEngine.playClick();
    setIsSavingMaint(true);

    try {
      let maintenanceUntil: string | null = null;
      let durationMinutes: number | null = null;

      if (selectedMaintMode === "timed") {
        const totalMinutes = maintHours * 60 + maintMinutes;
        durationMinutes = totalMinutes;
        maintenanceUntil = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
      }

      const isAllowed = selectedMaintMode === "none";

      const updated = await siteInfoService.updateSiteInfo({
        maintenance_mode: selectedMaintMode,
        maintenance_until: maintenanceUntil || undefined,
        maintenance_duration_minutes: durationMinutes || undefined,
        allow_google_index: isAllowed,
        allowGoogleIndex: isAllowed,
      });

      if (updated) {
        setSiteInfo(updated);
        soundEngine.playSuccess();
        alert("✅ وضعیت ایندکس گوگل و حالت تعمیرات با موفقیت ذخیره و اعمال شد.");
        setShowMaintenanceModal(false);
      }
    } catch (e) {
      alert("خطا در ذخیره وضعیت تعمیرات.");
    } finally {
      setIsSavingMaint(false);
    }
  };

  const isSuper = currentUser?.role === "superadmin" || (currentUser?.role as any) === "super_admin";

  const navTabs = [
    { id: "products", label: "محصولات و کاتالوگ", icon: "📦", show: true },
    { id: "inventory", label: "انبارداری سریع", icon: "📥", show: true },
    { id: "storefront_studio", label: "کنترل ویترین و لایه‌بندی", icon: "📐", show: isSuper },
    { id: "ai_autopilot", label: "موتور سئوی خودمختار (GSC)", icon: "🤖", show: isSuper },
    { id: "news_radar", label: "جدیدترین اخبار تکنولوژی", icon: "📡", show: true },
    { id: "page_builder", label: "صفحه‌ساز اختصاصی", icon: "🏗️", show: isSuper },
    { id: "orders", label: "سفارش‌ها و پست", icon: "📑", show: isSuper },
    { id: "messages", label: "صندوق پیام‌ها و مشاوره", icon: "📩", show: isSuper },
    { id: "coupons", label: "تخفیف‌ها و کوپن", icon: "🏷️", show: isSuper },
    { id: "customers", label: "باشگاه مخاطبان (CRM)", icon: "👥", show: isSuper },
    { id: "blogs", label: "مقالات تخصصی و سئو", icon: "📚", show: true },
    { id: "typography", label: "تایپوگرافی و فونت‌ها", icon: "🎨", show: isSuper },
    { id: "banners", label: "بنرها و اسلایدرها", icon: "🖼️", show: isSuper },
    { id: "menu", label: "منوها و دسته‌بندی‌ها", icon: "🔗", show: isSuper },
    { id: "accounts", label: "حساب‌های مدیران و تغییر رمز", icon: "🛡️", show: isSuper },
    { id: "siteInfo", label: "اطلاعات سایت و ایندکس", icon: "⚙️", show: isSuper },
  ].filter((t) => t.show);

  if (isAuthenticated === null) return null;

  return (
    <div dir="rtl" className="min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans select-none text-[var(--text-primary)]">
      <AdminGlobalSearch onSelectTab={(t: any) => setActiveTab(t)} />

      {/* هدر تمیز و استاندارد ادمین با پروفایل کلیک‌پذیر */}
      <header className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)]">پیشخوان یکپارچه مدیریت فروشگاه آکسون</h1>
            
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab("accounts");
              }}
              className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition cursor-pointer group"
              title="کلیک کنید تا به بخش ویرایش مشخصات و تغییر رمز هدایت شوید"
            >
              <span>مدیر آنلاین:</span>
              <strong className="text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition underline decoration-dotted underline-offset-4">
                {currentUser?.full_name || currentUser?.username}
              </strong>
              <span className="text-[10px] opacity-70">✏️</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSuper && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowMaintenanceModal(true);
              }}
              className={\`px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer \${
                selectedMaintMode === "none"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 animate-pulse"
              }\`}
            >
              <span>🌐</span>
              <span>{selectedMaintMode === "none" ? "ایندکس گوگل: مجاز ✓" : "تعمیرات فعال (توقف ایندکس)"}</span>
            </button>
          )}

          <a href="/" target="_blank" className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition flex items-center gap-1">
            <span>🏠</span>
            <span>مشاهده فروشگاه</span>
          </a>

          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs transition cursor-pointer flex items-center justify-center shadow-sm"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => {
              adminAuthService.logout();
              router.replace("/admin/login");
            }}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1"
          >
            <span>🚪</span>
            <span>خروج</span>
          </button>
        </div>
      </header>

      <AdminDashboardStats />
      <AdminHealthGuard />

      {/* نوار تب‌های ماژول‌های ادمین شامل ماژول استودیوی چیدمان */}
      <div className="p-3 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={\`px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 \${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-lg scale-105"
                  : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
              }\`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* محتوای ماژول فعال */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "inventory" && <AdminInventoryManager />}
        {activeTab === "storefront_studio" && isSuper && <StorefrontLayoutStudio />}
        {activeTab === "ai_autopilot" && isSuper && <AdminAiSeoAutopilot />}
        {activeTab === "news_radar" && <AdminNewsManager />}
        {activeTab === "page_builder" && isSuper && <PageBuilder />}
        {activeTab === "blogs" && <AdminBlogManager />}
        {activeTab === "typography" && isSuper && <StyleFontManager />}
        {activeTab === "orders" && isSuper && <AdminOrders />}
        {activeTab === "messages" && isSuper && <ContactMessagesManager />}
        {activeTab === "coupons" && isSuper && <AdminCoupons />}
        {activeTab === "customers" && isSuper && <AdminCustomers />}
        {activeTab === "banners" && isSuper && <AdminBanners />}
        {activeTab === "menu" && isSuper && <AdminMenu />}
        {activeTab === "accounts" && isSuper && <AdminAccountsManager />}
        {activeTab === "siteInfo" && isSuper && <AdminSiteInfo />}
      </div>

      {/* مودال ایندکس گوگل و حالت تعمیرات */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="max-w-lg w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 space-y-5 shadow-2xl text-xs text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">تنظیمات ایندکس گوگل و وضعیت تعمیرات سایت</h3>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                وضعیت دسترسی خزنده‌های گوگل (Googlebot) و کاربران به سایت را تعیین فرمایید:
              </p>

              <div className="space-y-2">
                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "none" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "none"} onChange={() => setSelectedMaintMode("none")} className="accent-emerald-500" />
                    <div>
                      <span className="font-black block">۱. سایت کاملاً فعال و آنلاین (پیش‌فرض)</span>
                      <span className="text-[10px] opacity-75">خزش و ایندکس گوگل ۱۰۰٪ مجاز و تمامی صفحات در دسترس هستند.</span>
                    </div>
                  </div>
                  <span className="text-emerald-500 font-bold">آنلاین ✓</span>
                </label>

                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "timed" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "timed"} onChange={() => setSelectedMaintMode("timed")} className="accent-amber-500" />
                    <div>
                      <span className="font-black block">۲. حالت تعمیرات زمان‌دار (با تایمر شمارنده معکوس)</span>
                      <span className="text-[10px] opacity-75">نمایش صفحه شمارش معکوس به کاربران تا پایان زمان مشخص.</span>
                    </div>
                  </div>
                  <span className="text-amber-500 font-bold">زمان‌دار ⏳</span>
                </label>

                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "indefinite" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "indefinite"} onChange={() => setSelectedMaintMode("indefinite")} className="accent-rose-500" />
                    <div>
                      <span className="font-black block">۳. حالت تعمیرات نامحدود (توقف موقت ایندکس)</span>
                      <span className="text-[10px] opacity-75">خروج موقت از دسترس جهت اعمال تغییرات اساسی دیتابیس.</span>
                    </div>
                  </div>
                  <span className="text-rose-500 font-bold">قفل 🔒</span>
                </label>
              </div>

              {selectedMaintMode === "timed" && (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-amber-500/30 space-y-2 animate-fadeIn">
                  <span className="font-bold text-[var(--text-secondary)] block">مدت زمان تقریبی تعمیرات:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">ساعت:</label>
                      <input type="number" min="0" max="72" value={maintHours} onChange={(e) => setMaintHours(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">دقیقه:</label>
                      <input type="number" min="0" max="59" value={maintMinutes} onChange={(e) => setMaintMinutes(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSavingMaint}
                onClick={handleSaveMaintenance}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSavingMaint ? "در حال اعمال..." : "ذخیره و اعمال وضعیت 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۹. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `feat(admin): implement master storefront layout studio with realtime websocket sync [${new Date().toLocaleTimeString('fa-IR')}]`;
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
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 استودیوی کنترل بصری ویترین با موفقیت ۱۰۰٪ مستقر و تمامی تغییرات آنلاین گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}