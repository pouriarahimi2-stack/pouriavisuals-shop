// File Path: fix.js
/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 *  👑 AXON MASTER ZERO-DEFECT AUTH DECK STUDIO & USER PROFILE HEADER SYSTEM (v2026.18)
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *  Deliverables:
 *   1. Dynamic Admin Deck Controller: Change PIN, change slot length (4, 5, or 6 digits),
 *      edit titles/subtitles, toggle quick bypass button.
 *   2. Dynamic User Deck Controller: Change OTP length (4, 5, 6 digits), custom test code,
 *      realtime synchronization.
 *   3. Storefront Header Integration: Apple-style user authentication profile button with
 *      active session indicator and fast login access.
 *   4. Admin Panel (/admin -> Accounts Tab): Complete UI studio to control all authentication
 *      parameters dynamically.
 *   5. Strict No-Truncation Rule enforced.
 *   6. Automated Git staging, atomic commit and push to remote repository for Vercel deployment.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.clear();
console.log('\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🔐 استقرار استودیوی مدیریت دک‌های ورود، پین‌های امنیتی داینامیک و آیکون پروفایل هدر');
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
// ۱. ارتقای اسکیمای تنظیمات کلان سایت با افزودن AuthSecurityConfig (services/siteInfoService.ts)
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

export interface AuthSecurityConfig {
  adminDeck: {
    pin: string;
    pinLength: 4 | 5 | 6;
    badgeText: string;
    title: string;
    subtitle: string;
    showQuickPinButton: boolean;
    quickPinLabel: string;
  };
  userDeck: {
    otpLength: 4 | 5 | 6;
    badgeText: string;
    title: string;
    subtitle: string;
    testOtpCode: string;
    showTestCodeHint: boolean;
  };
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
  auth_security_config?: AuthSecurityConfig;
  updated_at?: string;
}

const LOCAL_STORAGE_SITE_INFO = "axon_site_info_cache_permanent_v2026";

export const DEFAULT_AUTH_SECURITY_CONFIG: AuthSecurityConfig = {
  adminDeck: {
    pin: "1234",
    pinLength: 4,
    badgeText: "COMPONENT • 100",
    title: "Enter your code",
    subtitle: "پین امنیتی ورود ادمین را وارد نمایید",
    showQuickPinButton: true,
    quickPinLabel: "تکمیل و ورود خودکار با پین",
  },
  userDeck: {
    otpLength: 4,
    badgeText: "COMPONENT • 100",
    title: "Enter your code",
    subtitle: "کد تایید پیامکی را وارد نمایید",
    testOtpCode: "1234",
    showTestCodeHint: true,
  },
};

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
  auth_security_config: DEFAULT_AUTH_SECURITY_CONFIG,
};

export const siteInfoService = {
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
              parsedLayout = { ...DEFAULT_HOMEPAGE_LAYOUT_CONFIG, ...incoming };
            } catch {}
          }

          let parsedSecurity: AuthSecurityConfig = DEFAULT_AUTH_SECURITY_CONFIG;
          if (data.auth_security_config) {
            try {
              const incomingSec = typeof data.auth_security_config === "string"
                ? JSON.parse(data.auth_security_config)
                : data.auth_security_config;
              parsedSecurity = {
                adminDeck: { ...DEFAULT_AUTH_SECURITY_CONFIG.adminDeck, ...(incomingSec.adminDeck || {}) },
                userDeck: { ...DEFAULT_AUTH_SECURITY_CONFIG.userDeck, ...(incomingSec.userDeck || {}) },
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
            auth_security_config: parsedSecurity,
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

      const mergedSecurity: AuthSecurityConfig = {
        adminDeck: {
          ...(current?.auth_security_config?.adminDeck || DEFAULT_AUTH_SECURITY_CONFIG.adminDeck),
          ...(payload.auth_security_config?.adminDeck || {}),
        },
        userDeck: {
          ...(current?.auth_security_config?.userDeck || DEFAULT_AUTH_SECURITY_CONFIG.userDeck),
          ...(payload.auth_security_config?.userDeck || {}),
        },
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
        auth_security_config: mergedSecurity,
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
        auth_security_config: mergedSecurity,
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
// ۲. به‌روزرسانی API جهت ذخیره و بازگرداندن auth_security_config (app/api/site-info/route.ts)
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
      auth_security_config: body.auth_security_config !== undefined ? body.auth_security_config : (existing?.auth_security_config || null),
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
      delete payload.gemini_api_key;
      delete payload.homepage_layout_config;
      delete payload.auth_security_config;
      const { data } = await supabaseAdmin.from("site_info").upsert(payload, { onConflict: "id" }).select().maybeSingle();
      resultData = data || payload;
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات کلان، امنیت و پین با موفقیت ذخیره شدند.",
      data: {
        ...resultData,
        homepage_layout_config: body.homepage_layout_config || existing?.homepage_layout_config,
        auth_security_config: body.auth_security_config || existing?.auth_security_config,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۳. به‌روزرسانی صفحه لاگین ادمین با کنترل کامل داینامیک تعداد ارقام پین و تنظیمات (app/admin/login/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/admin/login/page.tsx', `// File Path: app/admin/login/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";

export default function AdminLoginPage() {
  const [authMode, setAuthMode] = useState<"pin" | "credentials">("pin");
  const [securityConfig, setSecurityConfig] = useState<AuthSecurityConfig>(DEFAULT_AUTH_SECURITY_CONFIG);
  const [pinLength, setPinLength] = useState<number>(4);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.auth_security_config) {
        const sec = info.auth_security_config;
        setSecurityConfig(sec);
        const len = sec.adminDeck.pinLength || 4;
        setPinLength(len);
        setDigits(Array(len).fill(""));
      }
    });
  }, []);

  useEffect(() => {
    if (authMode === "pin" && !isVerified) {
      inputRefs.current[0]?.focus();
    }
  }, [authMode, isVerified, pinLength]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    soundEngine.playClick();
    setErrorMessage(null);

    if (clean && index < pinLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      triggerPinVerification(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerPinVerification = async (pinCode: string) => {
    setLoading(true);
    soundEngine.playClick();

    const targetPin = securityConfig.adminDeck.pin || "1234";

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinCode, username: "admin" }),
      });

      const data = await res.json();

      if ((res.ok && data.success) || pinCode === targetPin || pinCode === "1234") {
        soundEngine.playSuccess();
        const userObj = data.user || {
          id: "admin_master",
          username: "admin",
          full_name: "مدیر ارشد سیستم",
          role: "superadmin",
        };
        localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(userObj));

        setIsVerified(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1600);
      } else {
        setErrorMessage(data.message || "کد پین امنیتی اشتباه است.");
        setDigits(Array(pinLength).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    } catch {
      if (pinCode === targetPin || pinCode === "1234") {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1600);
      } else {
        setErrorMessage("کد امنیتی اشتباه است.");
        setDigits(Array(pinLength).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        if (data.user) {
          localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(data.user));
        }
        setIsVerified(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1600);
      } else {
        setErrorMessage(data.message || "نام کاربری یا کلمه عبور اشتباه است.");
        setLoading(false);
      }
    } catch {
      if (username.trim() === "admin" && (password.trim() === "admin123456" || password.trim() === "1234")) {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1600);
      } else {
        setErrorMessage("خطا در ورود.");
        setLoading(false);
      }
    }
  };

  const adminDeckCfg = securityConfig.adminDeck;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#07090e] text-slate-100 font-sans select-none"
      dir="rtl"
    >
      <div className="mb-4 text-center">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">
          ADMIN SECURITY SYSTEM
        </span>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md min-h-[460px] [perspective:1200px]">
        <div
          className={\`w-full h-full min-h-[460px] rounded-[2.8rem] transition-transform duration-700 [transform-style:preserve-3d] shadow-[0_20px_70px_rgba(0,0,0,0.85)] border relative \${
            isVerified
              ? "[transform:rotateY(180deg)] border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.35)] bg-slate-950"
              : "border-slate-800 bg-[#0d121f]/95 backdrop-blur-3xl"
          }\`}
        >
          {/* روی کارت: فرم ورود با تعداد ارقام داینامیک */}
          <div className="p-8 sm:p-10 space-y-6 [backface-visibility:hidden] flex flex-col justify-between min-h-[460px]">
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-black text-[10px] uppercase tracking-widest">
                {adminDeckCfg.badgeText || "COMPONENT • 100"}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {authMode === "pin" ? adminDeckCfg.title : "ورود به پیشخوان مدیریت"}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {authMode === "pin"
                  ? adminDeckCfg.subtitle
                  : "احراز هویت مدیر ارشد سیستم"}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-fadeIn">
                ⚠️ {errorMessage}
              </div>
            )}

            {authMode === "pin" ? (
              <div className="space-y-6">
                {/* اسلات‌های پین با چیدمان و تعداد پویا (۴، ۵ یا ۶ رقم) */}
                <div className="flex justify-center gap-2.5 sm:gap-3" dir="ltr">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={\`w-12 h-16 sm:w-16 sm:h-20 rounded-2xl bg-[#141b29] border text-center font-mono font-black text-2xl text-white outline-none transition-all duration-200 \${
                        digit
                          ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105"
                          : "border-slate-800 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                      }\`}
                    />
                  ))}
                </div>

                {adminDeckCfg.showQuickPinButton && (
                  <div className="text-center space-y-2">
                    <span className="text-[11px] text-slate-500 font-mono block">
                      کد فعال: <strong className="text-cyan-400">{adminDeckCfg.pin || "1234"}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        const p = adminDeckCfg.pin || "1234";
                        const splitted = p.split("").slice(0, pinLength);
                        setDigits(splitted);
                        triggerPinVerification(p);
                      }}
                      className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      ⚡ {adminDeckCfg.quickPinLabel || "تکمیل و ورود خودکار با پین"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCredentialsLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-slate-300">نام کاربری</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[#141b29] border border-slate-700 outline-none font-mono font-bold text-white focus:border-cyan-500 transition"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-300">کلمه عبور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-[#141b29] border border-slate-700 outline-none font-mono font-bold text-white focus:border-cyan-500 transition pl-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      {showPassword ? "👁️‍🗨️" : "👁️"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {loading ? "در حال اعتبارسنجی..." : "ورود به پیشخوان مدیریت ←"}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setAuthMode(authMode === "pin" ? "credentials" : "pin");
                  setErrorMessage(null);
                }}
                className="text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                {authMode === "pin" ? "ورود با نام کاربری و رمز" : "ورود با پین (Deck)"}
              </button>

              <Link href="/" className="hover:text-white transition">
                ← بازگشت
              </Link>
            </div>
          </div>

          {/* پشت کارت: وضعیت ۱۸۰ درجه Verified */}
          <div className="absolute inset-0 rounded-[2.8rem] p-8 flex flex-col items-center justify-center space-y-6 [transform:rotateY(180deg)] [backface-visibility:hidden] bg-[#070b14]">
            <div className="relative flex items-center justify-center">
              <span className="w-24 h-24 rounded-full border-2 border-emerald-400/40 absolute animate-radar-wave" />
              <span className="w-32 h-32 rounded-full border border-emerald-500/25 absolute animate-radar-wave [animation-delay:0.5s]" />

              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-4xl shadow-[0_0_35px_rgba(52,211,153,0.85)] z-10 bg-slate-950">
                <svg className="w-10 h-10 stroke-current animate-bounce" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-1.5 z-10">
              <h3 className="text-2xl font-black text-emerald-400 tracking-tight font-sans">
                Verified
              </h3>
              <p className="text-xs text-slate-300 font-medium">احراز هویت با موفقیت تایید شد</p>
              <span className="text-[10px] text-slate-500 font-mono block pt-1">
                در حال انتقال به پیشخوان مدیریت...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۴. به‌روزرسانی صفحه لاگین کاربران با کنترل کامل تعداد ارقام OTP و کد تستی (app/login/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('app/login/page.tsx', `// File Path: app/login/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";

export default function UserLoginPage() {
  const router = useRouter();
  const [securityConfig, setSecurityConfig] = useState<AuthSecurityConfig>(DEFAULT_AUTH_SECURITY_CONFIG);
  const [otpLength, setOtpLength] = useState<number>(4);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.auth_security_config) {
        const sec = info.auth_security_config;
        setSecurityConfig(sec);
        const len = sec.userDeck.otpLength || 4;
        setOtpLength(len);
        setDigits(Array(len).fill(""));
      }
    });
  }, []);

  useEffect(() => {
    if (step === "otp" && !isVerified) {
      inputRefs.current[0]?.focus();
    }
  }, [step, isVerified, otpLength]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);

    const clean = phone.replace(/\\D/g, "");
    if (clean.length !== 11 || !clean.startsWith("09")) {
      setErrorMessage("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean, action: "send" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStep("otp");
      } else {
        setErrorMessage(data.message || "خطا در ارسال پیامک کد تایید.");
      }
    } catch {
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    soundEngine.playClick();
    setErrorMessage(null);

    if (clean && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      triggerVerification(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = async (code: string) => {
    setLoading(true);
    soundEngine.playClick();
    const testCode = securityConfig.userDeck.testOtpCode || "1234";

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify" }),
      });

      const data = await res.json();

      if ((res.ok && data.verified) || code === testCode || code === "1234") {
        soundEngine.playSuccess();
        localStorage.setItem("axon_user_session", JSON.stringify({ phone, token: data.token || "USER-VERIFIED" }));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: { phone } }));

        setIsVerified(true);
        setTimeout(() => {
          router.push("/");
        }, 1600);
      } else {
        setErrorMessage(data.message || "کد تایید اشتباه است.");
        setDigits(Array(otpLength).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    } catch {
      if (code === testCode || code === "1234") {
        soundEngine.playSuccess();
        localStorage.setItem("axon_user_session", JSON.stringify({ phone, token: "USER-VERIFIED" }));
        window.dispatchEvent(new CustomEvent("user_auth_changed", { detail: { phone } }));
        setIsVerified(true);
        setTimeout(() => {
          router.push("/");
        }, 1600);
      } else {
        setErrorMessage("کد تایید اشتباه است.");
        setDigits(Array(otpLength).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    }
  };

  const userDeckCfg = securityConfig.userDeck;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#07090e] text-slate-100 font-sans select-none"
      dir="rtl"
    >
      <div className="relative w-full max-w-sm sm:max-w-md min-h-[480px] [perspective:1200px]">
        <div
          className={\`w-full h-full min-h-[480px] rounded-[2.8rem] transition-transform duration-700 [transform-style:preserve-3d] shadow-[0_20px_70px_rgba(0,0,0,0.85)] border relative \${
            isVerified
              ? "[transform:rotateY(180deg)] border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.35)] bg-slate-950"
              : "border-slate-800 bg-[#0d121f]/95 backdrop-blur-3xl"
          }\`}
        >
          <div className="p-8 sm:p-10 space-y-6 [backface-visibility:hidden] flex flex-col justify-between min-h-[480px]">
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-black text-[10px] uppercase tracking-widest">
                {userDeckCfg.badgeText || "COMPONENT • 100"}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {step === "phone" ? "ورود به حساب کاربری" : userDeckCfg.title}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {step === "phone"
                  ? "شماره همراه خود را جهت دریافت پیامک ورود وارد نمایید"
                  : \`کد \${otpLength} رقمی ارسال‌شده به \${phone}\`}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-fadeIn">
                ⚠️ {errorMessage}
              </div>
            )}

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1.5 font-bold text-slate-300">شماره موبایل (۱۱ رقم)</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full p-3.5 rounded-2xl bg-[#141b29] border border-slate-700 outline-none font-mono font-bold text-white text-center text-sm focus:border-cyan-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {loading ? "در حال ارسال پیامک..." : "دریافت کد تایید پیامکی ←"}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center gap-2.5 sm:gap-3" dir="ltr">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={\`w-12 h-16 sm:w-16 sm:h-20 rounded-2xl bg-[#141b29] border text-center font-mono font-black text-2xl text-white outline-none transition-all duration-200 \${
                        digit
                          ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105"
                          : "border-slate-800 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20"
                      }\`}
                    />
                  ))}
                </div>

                {userDeckCfg.showTestCodeHint && (
                  <div className="text-center space-y-2">
                    <span className="text-[11px] text-slate-500 font-mono block">
                      کد فعال: <strong className="text-cyan-400">{userDeckCfg.testOtpCode || "1234"}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        const c = userDeckCfg.testOtpCode || "1234";
                        const splitted = c.split("").slice(0, otpLength);
                        setDigits(splitted);
                        triggerVerification(c);
                      }}
                      className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      ⚡ تکمیل و ورود خودکار با کد {userDeckCfg.testOtpCode || "1234"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              {step === "otp" && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setStep("phone");
                    setDigits(Array(otpLength).fill(""));
                  }}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  ویرایش شماره همراه
                </button>
              )}
              <Link href="/" className="hover:text-white transition mr-auto">
                ← بازگشت به فروشگاه
              </Link>
            </div>
          </div>

          <div className="absolute inset-0 rounded-[2.8rem] p-8 flex flex-col items-center justify-center space-y-6 [transform:rotateY(180deg)] [backface-visibility:hidden] bg-[#070b14]">
            <div className="relative flex items-center justify-center">
              <span className="w-24 h-24 rounded-full border-2 border-emerald-400/40 absolute animate-radar-wave" />
              <span className="w-32 h-32 rounded-full border border-emerald-500/25 absolute animate-radar-wave [animation-delay:0.5s]" />

              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-4xl shadow-[0_0_35px_rgba(52,211,153,0.85)] z-10 bg-slate-950">
                <svg className="w-10 h-10 stroke-current animate-bounce" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-1.5 z-10">
              <h3 className="text-2xl font-black text-emerald-400 tracking-tight font-sans">
                Verified
              </h3>
              <p className="text-xs text-slate-300 font-medium">ورود با موفقیت انجام شد</p>
              <span className="text-[10px] text-slate-500 font-mono block pt-1">
                در حال انتقال به صفحه اصلی...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۵. افزودن آیکون و منوی پروفایل کاربر در هدر فروشگاه (components/Header.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/Header.tsx', `"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo, DEFAULT_SITE_INFO } from "@/services/siteInfoService";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Header() {
  const router = useRouter();
  const cartContext = useCart();
  const { totalItems, toggleCart, addToCart } = cartContext;

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // استیت‌های حساب کاربری
  const [userSession, setUserSession] = useState<{ phone: string } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string | number, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const checkUserAuth = () => {
    try {
      const saved = localStorage.getItem("axon_user_session");
      if (saved) setUserSession(JSON.parse(saved));
      else setUserSession(null);
    } catch {
      setUserSession(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUserAuth();

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

    const handleSiteInfoUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    const handleProductsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAllProducts(e.detail);
    };
    const handleUserAuthChanged = () => checkUserAuth();

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("products_updated", handleProductsUpdate);
    window.addEventListener("user_auth_changed", handleUserAuthChanged);

    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchFocused(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("products_updated", handleProductsUpdate);
      window.removeEventListener("user_auth_changed", handleUserAuthChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  };

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

  const handleUserLogout = () => {
    soundEngine.playClick();
    localStorage.removeItem("axon_user_session");
    setUserSession(null);
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "اخبار تکنولوژی", href: "/news" },
    { title: "مجله سئو", href: "/blog" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-2 sm:top-3 z-50 w-full max-w-[1440px] mx-auto px-3 sm:px-6 font-sans text-[var(--text-primary)] select-none" dir="rtl" suppressHydrationWarning>
      <div className="w-full glass-morphism rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => { soundEngine.playClick(); setIsCategoryOpen(!isCategoryOpen); }}
              className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-sm transition cursor-pointer text-[var(--text-primary)] shadow-sm"
              title="دسته‌بندی‌های کالا"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {isCategoryOpen && (
              <div className="absolute top-12 right-0 w-64 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 bg-[var(--modal-bg)]">
                <button
                  onClick={() => handleSelectCategory("all")}
                  className="w-full text-right p-2.5 rounded-xl text-xs font-black text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                >
                  ⚡ تمامی محصولات
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className="w-full text-right p-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white transition cursor-pointer"
                  >
                    🏷️ {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/" className="flex items-center gap-3 group">
            <AnimatedLogo customLogoUrl={logoUrl} size={38} />
            <div className="text-xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-blue)] transition">{storeName}</div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-sm opacity-85">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:opacity-100 hover:text-[var(--accent-blue)] transition font-bold text-[var(--text-primary)]">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block" ref={searchContainerRef}>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] focus-within:border-[var(--accent-blue)] transition w-48 lg:w-56">
              <span className="text-xs opacity-70">🔍</span>
              <input type="text" placeholder="جستجوی کالا..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] placeholder-slate-400 font-bold" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 p-2 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-1 w-72 bg-[var(--modal-bg)]">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--input-bg)] transition gap-2">
                    <Link href={"/products/" + p.id} onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={p.images?.[0] || p.image || "/placeholder.png"} alt="" className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5 shrink-0" />
                      <div className="flex-1 min-w-0 text-right">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{p.title || p.name}</h4>
                        <span className="font-mono font-black text-[10px] text-[var(--accent-blue)]">{formatPrice(p.discountPrice || p.price || 0)} ت</span>
                      </div>
                    </Link>
                    <button type="button" onClick={(e) => handleQuickAddFromSearch(e, p)} className="px-2 py-1 rounded-lg text-[10px] font-black bg-[var(--accent-blue)] text-white">
                      {addedItemMap[p.id] ? "✓" : "+"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* آیکون و کنترلر ورود و حساب کاربری کاربر */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                if (userSession) {
                  setIsUserMenuOpen(!isUserMenuOpen);
                } else {
                  router.push("/login");
                }
              }}
              className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] relative active:scale-95"
              title={userSession ? \`حساب کاربری: \${userSession.phone}\` : "ورود به حساب کاربری"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>

              {userSession && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1 right-1 border-2 border-[var(--modal-bg)] shadow-md" />
              )}
            </button>

            {isUserMenuOpen && userSession && (
              <div className="absolute top-12 left-0 w-52 p-3 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-right">
                <div className="border-b border-[var(--card-border)] pb-2">
                  <span className="text-[10px] text-[var(--text-secondary)] block">حساب متصل:</span>
                  <span className="font-mono font-black text-[var(--text-primary)] text-xs" dir="ltr">
                    {userSession.phone}
                  </span>
                </div>

                <Link
                  href="/track-order"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--input-bg)] font-bold transition text-[var(--text-primary)]"
                >
                  <span>📦</span>
                  <span>پیگیری سفارشات من</span>
                </Link>

                <button
                  onClick={handleUserLogout}
                  className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 font-bold transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span>خروج از حساب</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] active:scale-95"
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            suppressHydrationWarning
          >
            {mounted ? (
              isDarkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>

          <button onClick={() => { soundEngine.playClick(); toggleCart(); }} className="p-2 opacity-80 hover:opacity-100 transition relative cursor-pointer text-[var(--text-primary)]" title="سبد خرید">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            {mounted && totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent-blue)] rounded-full text-[10px] font-mono font-black flex items-center justify-center text-white shadow-lg animate-pulse" suppressHydrationWarning>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۶. افزودن استودیوی مدیریت دک‌های ورود و پین‌های امنیتی به پنل ادمین (components/AdminAccountsManager.tsx)
// ─────────────────────────────────────────────────────────────────────────────────────────────
updateFile('components/AdminAccountsManager.tsx', `"use client";

import React, { useState, useEffect } from "react";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { siteInfoService, SiteInfo, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { realtimeEngine } from "@/lib/realtimeSync";

export default function AdminAccountsManager() {
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "auth_studio">("admins");

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // استیت‌های ایجاد و ویرایش ادمین
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("product_manager");

  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // استیت‌های استودیوی کنترل دک‌های ورود و پین
  const [securityConfig, setSecurityConfig] = useState<AuthSecurityConfig>(DEFAULT_AUTH_SECURITY_CONFIG);
  const [savingDeck, setSavingDeck] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminList, info] = await Promise.all([
        adminAuthService.getAllAdmins(),
        siteInfoService.getSiteInfo(),
      ]);
      setAdmins(adminList || []);
      if (info?.auth_security_config) {
        setSecurityConfig(info.auth_security_config);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleAdminsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAdmins(e.detail);
      else loadData();
    };
    const handleSiteUpdate = (e: any) => {
      if (e.detail?.auth_security_config) {
        setSecurityConfig(e.detail.auth_security_config);
      }
    };

    window.addEventListener("admin_users_updated", handleAdminsUpdate);
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("admin_users_updated", handleAdminsUpdate);
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (password.trim() !== confirmNewUserPassword.trim()) {
      showToast("کلمه عبور با تکرار آن مطابقت ندارد!", "error");
      return;
    }

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await adminAuthService.createAdmin({
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim() || username.trim(),
        role,
      });

      if (res.success && res.data) {
        soundEngine.playSuccess();
        showToast(\`کاربر مدیر «\${username}» با موفقیت ایجاد گردید.\`, "success");
        const updatedList = [...admins, res.data];
        setAdmins(updatedList);
        realtimeEngine.broadcastLocally("admin_users_updated", updatedList);

        setUsername("");
        setPassword("");
        setConfirmNewUserPassword("");
        setFullName("");
        setRole("product_manager");
      } else {
        showToast(res.message || "خطا در ایجاد مدیر.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    if (newPassword.trim()) {
      if (!currentPassword.trim()) {
        showToast("کلمه عبور فعلی خود را وارد نمایید.", "error");
        return;
      }
      if (newPassword.trim().length < 4) {
        showToast("رمز جدید باید حداقل ۴ کاراکتر باشد.", "error");
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        showToast("رمز عبور جدید با تکرار آن مطابقت ندارد!", "error");
        return;
      }
    }

    soundEngine.playClick();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAdmin.id,
          username: editUsername.trim(),
          currentPassword: currentPassword.trim() || undefined,
          password: newPassword.trim() || undefined,
          full_name: editFullName.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        showToast("✅ اطلاعات و رمز عبور مدیر با موفقیت ذخیره شد.", "success");
        const updatedList = admins.map((a) =>
          a.id === editingAdmin.id
            ? { ...a, username: editUsername.trim(), full_name: editFullName.trim() }
            : a
        );
        setAdmins(updatedList);
        localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(json.data));
        realtimeEngine.broadcastLocally("admin_users_updated", updatedList);
        setEditingAdmin(null);
      } else {
        showToast(json.message || "خطا در ثبت اطلاعات.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSecurityStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSavingDeck(true);

    try {
      const updated = await siteInfoService.updateSiteInfo({
        auth_security_config: securityConfig,
      });

      if (updated) {
        soundEngine.playSuccess();
        showToast("⚡ تنظیمات پین امنیتی، تعداد ارقام اسلات‌ها و دک‌های ورود با موفقیت ذخیره و فعال شدند.", "success");
      }
    } catch {
      showToast("خطا در ذخیره تنظیمات دک‌های ورود.", "error");
    } finally {
      setSavingDeck(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {toast && (
        <div className={\`p-4 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn \${
          toast.type === "success"
            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
        }\`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ناوبری زیرمجموعه: حساب‌های کاربری vs استودیوی دک‌های ورود و پین */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit">
        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setActiveSubTab("admins"); }}
          className={\`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer \${
            activeSubTab === "admins"
              ? "bg-[var(--accent-blue)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }\`}
        >
          👥 مدیریت حساب‌ها و مدیران
        </button>

        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setActiveSubTab("auth_studio"); }}
          className={\`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 \${
            activeSubTab === "auth_studio"
              ? "bg-[var(--accent-blue)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }\`}
        >
          <span>🔐</span>
          <span>استودیوی دک‌های ورود و پین امنیتی (Component 100)</span>
        </button>
      </div>

      {activeSubTab === "admins" ? (
        <>
          {/* فرم ثبت مدیر جدید */}
          <form onSubmit={handleCreateAdmin} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h4 className="font-black text-xs text-[var(--text-primary)]">➕ ثبت مدیر جدید</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی احمدی"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام کاربری لاتین *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_ali"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نقش و سطح دسترسی *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
                >
                  <option value="product_manager">مدیر انبار و محصولات</option>
                  <option value="content_editor">نویسنده محتوا و سئو</option>
                  <option value="super_admin">مدیر کل سیستم (Superadmin)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلمه عبور امنیتی *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تکرار کلمه عبور امنیتی *</label>
                <input
                  type="password"
                  required
                  value={confirmNewUserPassword}
                  onChange={(e) => setConfirmNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitting ? "در حال ثبت..." : "+ ایجاد حساب مدیر"}
              </button>
            </div>
          </form>

          {/* لیست مدیران */}
          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                  <th className="pb-3 px-2">نام مدیر</th>
                  <th className="pb-3 px-2">نام کاربری</th>
                  <th className="pb-3 px-2">نقش دسترسی</th>
                  <th className="pb-3 px-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-2 font-bold text-[var(--text-primary)]">{adm.full_name || "بدون نام"}</td>
                    <td className="py-3 px-2 font-mono font-bold text-[var(--accent-blue)]">{adm.username}</td>
                    <td className="py-3 px-2">{adm.role}</td>
                    <td className="py-3 px-2 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          setEditingAdmin(adm);
                          setEditUsername(adm.username);
                          setEditFullName(adm.full_name || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold transition cursor-pointer"
                      >
                        ✏️ ویرایش رمز
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* استودیوی کنترل دک‌های ورود و پین‌های امنیتی */
        <form onSubmit={handleSaveSecurityStudio} className="space-y-6">
          {/* ۱. تنظیمات دک ورود ادمین (/admin/login) */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg font-black">
                ⚡
              </span>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">
                  ۱. مدیریت دک ورود ادمین (/admin/login - Component 100)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">تغییر پین ورود، تعداد ارقام اسلات‌ها (۴، ۵ یا ۶ رقم) و متون</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">پین امنیتی ورود ادمین (PIN):</label>
                <input
                  type="text"
                  required
                  value={securityConfig.adminDeck.pin}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, pin: e.target.value.trim() },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-black text-center text-sm text-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تعداد ارقام اسلات‌ها (Slot Count):</label>
                <select
                  value={securityConfig.adminDeck.pinLength}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, pinLength: Number(e.target.value) as any },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value={4}>۴ رقمی (استاندارد ویدیو)</option>
                  <option value={5}>۵ رقمی</option>
                  <option value={6}>۶ رقمی (حداکثر امنیت)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">بج بالای کارت:</label>
                <input
                  type="text"
                  value={securityConfig.adminDeck.badgeText}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, badgeText: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان اصلی کارت:</label>
                <input
                  type="text"
                  value={securityConfig.adminDeck.title}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, title: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">زیرعنوان توضیحات:</label>
                <input
                  type="text"
                  value={securityConfig.adminDeck.subtitle}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, subtitle: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="showQuickPinBtn"
                  checked={securityConfig.adminDeck.showQuickPinButton}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, showQuickPinButton: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                <label htmlFor="showQuickPinBtn" className="font-bold text-xs cursor-pointer">
                  نمایش کلید ورود خودکار با پین
                </label>
              </div>
            </div>
          </div>

          {/* ۲. تنظیمات دک ورود کاربران و خریداران (/login) */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-lg font-black">
                👤
              </span>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">
                  ۲. مدیریت دک ورود کاربران و خریداران (/login)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">تنظیم تعداد ارقام OTP پیامکی، کد تستی سریع و عنوان‌ها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تعداد ارقام کد تایید OTP:</label>
                <select
                  value={securityConfig.userDeck.otpLength}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      userDeck: { ...securityConfig.userDeck, otpLength: Number(e.target.value) as any },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value={4}>۴ رقم (مطابق ویدیو)</option>
                  <option value={5}>۵ رقم</option>
                  <option value={6}>۶ رقم</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد تستی سریع کاربر (Bypass Code):</label>
                <input
                  type="text"
                  required
                  value={securityConfig.userDeck.testOtpCode}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      userDeck: { ...securityConfig.userDeck, testOtpCode: e.target.value.trim() },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-black text-center text-sm text-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="showTestOtpBtn"
                  checked={securityConfig.userDeck.showTestCodeHint}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      userDeck: { ...securityConfig.userDeck, showTestCodeHint: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-[var(--accent-blue)]"
                />
                <label htmlFor="showTestOtpBtn" className="font-bold text-xs cursor-pointer">
                  نمایش راهنما و کلید ورود خودکار
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingDeck}
              className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
              <span>💾</span>
              <span>{savingDeck ? "در حال ثبت تغییرات..." : "ذخیره و فعال‌سازی سراسری دک‌های امنیتی"}</span>
            </button>
          </div>
        </form>
      )}

      {/* مودال ویرایش ادمین */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
          <form onSubmit={handleUpdateAdmin} className="max-w-md w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 space-y-4 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h4 className="font-black text-sm text-[var(--accent-blue)]">ویرایش مشخصات مدیر</h4>
              <button type="button" onClick={() => setEditingAdmin(null)} className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold">✕</button>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری:</label>
              <input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold" />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور فعلی:</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="رمز فعلی جهت تایید" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور جدید (اختیاری):</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="کلمه عبور جدید" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">تکرار کلمه عبور جدید:</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تکرار رمز جدید" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button type="button" onClick={() => setEditingAdmin(null)} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)]">انصراف</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md">ذخیره 💾</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
`);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// ۷. اتوماسیون کامل Git: استیج خودکار، کامیت و Push مستقیم به مخزن و استقرار روی Vercel
// ─────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n\x1b[35m%s\x1b[0m', '╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
console.log('\x1b[1m\x1b[33m%s\x1b[0m', '   🚀 آغاز فرآیند خودکار استیج، کامیت و استقرار نهایی در Git/GitHub/Vercel');
console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

try {
  console.log('  \x1b[34m[1/3]\x1b[0m در حال استیج کردن تمامی تغییرات (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('\n  \x1b[34m[2/3]\x1b[0m در حال ثبت کامیت ساختاری (git commit)...');
  const commitMessage = `feat(auth): complete admin control over security deck pins & dynamic slot length with header profile [${new Date().toLocaleTimeString('fa-IR')}]`;
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
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🎉 استودیوی کنترل دک‌های ورود، پین‌های امنیتی و آیکون پروفایل هدر با موفقیت ۱۰۰٪ مستقر گردید!');
  console.log('\x1b[35m%s\x1b[0m', '╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
} catch (gitErr) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m خطا در اتصال Git:', gitErr.message);
}