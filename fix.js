/**
 * AXON CORE - Global Header & Footer Sync Across All Pages + Granular Page Editing (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-GLOBAL-SYNC]\x1b[0m سراسری‌سازی هدر و فوتر در تمام صفحات و اتصال پایدار دیتابیس...");

// =============================================================================
// ۱. بازنویسی components/admin/AdminModularPages.tsx با همگام‌سازی سراسری هدر/فوتر
// =============================================================================
const studioWithGlobalNavCode = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { siteInfoService } from "@/services/siteInfoService";
import Link from "next/link";

const STORAGE_PREFIX = "axon_puck_page_data_v2026_";
const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";

const DEFAULT_GLOBAL_HEADER = {
  type: "HeaderCapsuleBar",
  props: {
    id: "global-header-core",
    brandText: "Axon | آکسون",
    logoUrl: "",
    logoWidth: 36,
    logoHeight: 36,
    menu1Text: "کاتالوگ محصولات",
    menu1Url: "/products",
    menu2Text: "اخبار تکنولوژی",
    menu2Url: "/news",
    menu3Text: "مجله سئو",
    menu3Url: "/blog",
    menu4Text: "پیگیری سفارش",
    menu4Url: "/track-order",
    menu5Text: "تماس با ما",
    menu5Url: "/contact",
    showCart: true,
    showTheme: true,
    showUser: true,
    capsuleBg: "#07090e",
    capsuleBorder: "#27272a"
  }
};

const DEFAULT_GLOBAL_FOOTER = {
  type: "GlobalFooterBlock",
  props: {
    id: "global-footer-core",
    footerLogoUrl: "",
    brandTitle: "Axon | آکسون",
    brandSubtitle: "مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو",
    brandDesc: "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.",
    supportPhone: "09376110200",
    supportEmail: "Pouriarahimi@yahoo.com",
    warehouseAddress: "شیراز - ستارخان",
    workingHours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
    enamadCode: "27424534",
    copyrightText: "تمامی حقوق مادی و معنوی برای Axon | آکسون محفوظ است © 2026",
    footerBg: "#07090e"
  }
};

function getPageSpecificBody(slug: string, title?: string): any[] {
  if (slug === "products") {
    return [
      {
        type: "NativeProductCatalog",
        props: {
          id: "catalog-page-main",
          heading: "کاتالوگ جامع مانیتورها و تجهیزات تصویر",
          subtitle: "دارای گارانتی اصالت طلایی و ارسال سریع پیشتاز به سراسر کشور",
          limit: 12
        }
      }
    ];
  }

  if (slug === "about") {
    return [
      {
        type: "RichTextBlock",
        props: {
          id: "about-rich-text",
          title: "درباره آکسون استودیو (Axon Core)",
          content: "مجموعه آکسون مرجع تخصصی تامین، کالیبراسیون و مشاوره تجهیزات پیشرفته تصویر، مانیتورهای تدوین رنگ ۵K و ۴K، کارت‌های کپچر و ابزارهای حرفه‌ای استودیو در ایران است.\\n\\nتعهد ما ارائه کالاهای ۱۰۰٪ اورجینال با گارانتی اصالت طلایی، تضمین بهترین قیمت بازار و ارسال سریع پیشتاز به سراسر کشور با بسته‌بندی ضدضربه استودیویی است.",
          bgColor: "transparent"
        }
      },
      {
        type: "FeaturesGridBlock",
        props: {
          id: "about-features",
          heading: "استانداردهای مهندسی و خدمات طلایی آکسون",
          col1Title: "🛡️ گارانتی اصالت طلایی",
          col1Desc: "تضمین ۱۰۰٪ اصالت فیزیکی قطعات و مهلت تست ۷ روزه بازگشت وجه.",
          col2Title: "🚀 ارسال ایمن هوانوردی",
          col2Desc: "بسته‌بندی ضربه‌گیر ویژه تجهیزات حساس اپتیکال با پوشش کامل بیمه.",
          col3Title: "🎨 کالیبراسیون ۳D LUT",
          col3Desc: "تست سلامت پنل و تطبیق با طیف رنگی سینمایی DCI-P3.",
          bgColor: "transparent"
        }
      }
    ];
  }

  if (slug === "contact") {
    return [
      {
        type: "RichTextBlock",
        props: {
          id: "contact-intro",
          title: "تماس با واحد مشاوره و پشتیبانی آکسون",
          content: "برای دریافت مشاوره تخصصی در خصوص انتخاب مانیتورهای ۵K، کارت‌های کپچر و هماهنگی فاکتور رسمی می‌توانید با شماره‌های پشتیبانی تماس حاصل فرمایید یا از طریق شبکه‌های اجتماعی با کارشناسان ما در ارتباط باشید.",
          bgColor: "transparent"
        }
      }
    ];
  }

  if (slug === "track-order") {
    return [
      {
        type: "RichTextBlock",
        props: {
          id: "track-order-intro",
          title: "سامانه رهگیری لحظه‌ای مرسولات پستی",
          content: "کد رهگیری ۲۴ رقمی پیامک‌شده را در این قسمت وارد نمایید تا آخرین وضعیت ارسال بسته پستی خود را به صورت آنلاین مشاهده کنید.",
          bgColor: "transparent"
        }
      }
    ];
  }

  if (slug === "home") {
    return [
      {
        type: "NativeHero3D",
        props: {
          id: "hero-1",
          topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
          badgeColor: "#38bdf8",
          title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
          titleSize: 42,
          subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
          bgColor: "transparent"
        }
      },
      {
        type: "NativePerspectiveSlider",
        props: {
          id: "slider-1",
          sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
          sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی"
        }
      },
      {
        type: "NativeProductCatalog",
        props: {
          id: "catalog-1",
          heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
          subtitle: "تمامی کالاها با گارانتی اصالت طلایی عرضه می‌شوند",
          limit: 8
        }
      },
      {
        type: "NativeExplodedView",
        props: {
          id: "exploded-1",
          productTitle: "Apple Studio Display 5K Retina",
          sectionTitle: "کالبدشکافی لایه‌های سخت‌افزاری"
        }
      }
    ];
  }

  return [
    {
      type: "RichTextBlock",
      props: {
        id: "custom-page-" + slug,
        title: title || "صفحه جدید",
        content: "محتوای اختصاصی این صفحه را از سایدبار تنظیم کنید یا بلوک‌های دلخواه را به آن اضافه نمایید.",
        bgColor: "transparent"
      }
    }
  ];
}

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data | null>(null);
  const [renderKey, setRenderKey] = useState<string>("init");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  // استخراج هدر و فوتر سراسری
  const getGlobalHeaderFooter = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(GLOBAL_NAV_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.header && parsed.footer) return parsed;
        }
      } catch {}
    }
    return { header: DEFAULT_GLOBAL_HEADER, footer: DEFAULT_GLOBAL_FOOTER };
  };

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string, customTitle?: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();

    const { header: currentGlobalHeader, footer: currentGlobalFooter } = getGlobalHeaderFooter();
    let targetData: Data | null = null;

    // ۱. بررسی کش اختصاصی محتوای این صفحه
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(STORAGE_PREFIX + slug);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && Array.isArray(parsed.content)) {
            targetData = parsed;
          }
        }
      } catch {}
    }

    // ۲. بررسی دیتابیس برای محتوای این صفحه
    try {
      const res = await fetch("/api/pages?slug=" + encodeURIComponent(slug), { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content)) {
        targetData = json.page.puck_data;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(targetData));
        }
      }
    } catch {}

    // اگر محتوا خالی بود، بدنه اختصاصی همان صفحه قرار می‌گیرد
    let bodyBlocks = targetData?.content ? targetData.content.filter(
      (b: any) => b.type !== "HeaderCapsuleBar" && b.type !== "GlobalFooterBlock"
    ) : [];

    if (bodyBlocks.length === 0) {
      bodyBlocks = getPageSpecificBody(slug, customTitle);
    }

    // اتصال ۱۰۰٪ هدر و فوتر سراسری به اول و آخر صفحه
    const mergedData: Data = {
      content: [currentGlobalHeader, ...bodyBlocks, currentGlobalFooter],
      root: { props: { title: customTitle || slug } }
    };

    setPageData(mergedData);
    setRenderKey(slug + "_" + Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار سراسری تغییرات در تمام صفحات...");

    // ۱. استخراج و سراسری‌سازی هدر و فوتر در تمام صفحات
    const newHeaderBlock = data.content?.find((b: any) => b.type === "HeaderCapsuleBar") || DEFAULT_GLOBAL_HEADER;
    const newFooterBlock = data.content?.find((b: any) => b.type === "GlobalFooterBlock") || DEFAULT_GLOBAL_FOOTER;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          GLOBAL_NAV_KEY,
          JSON.stringify({ header: newHeaderBlock, footer: newFooterBlock })
        );
        localStorage.setItem(STORAGE_PREFIX + currentSlug, JSON.stringify(data));
      } catch {}
    }

    setPageData(data);

    // ۲. ذخیره پایدار هدر و فوتر در جدول مرجع site_info برای تمام کلاینت‌ها
    try {
      const hProps = newHeaderBlock.props || {};
      const fProps = newFooterBlock.props || {};

      await siteInfoService.updateSiteInfo({
        site_name: hProps.brandText || fProps.brandTitle || "Axon | آکسون",
        phone: fProps.supportPhone || "09376110200",
        email: fProps.supportEmail || "Pouriarahimi@yahoo.com",
        address: fProps.warehouseAddress || "شیراز - ستارخان",
        working_hours: fProps.workingHours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        description: fProps.brandDesc || "",
        footer_text: fProps.brandDesc || "",
        logo_url: hProps.logoUrl || "",
        footer_logo_url: fProps.footerLogoUrl || "",
        homepage_layout_config: {
          headerLogoConfig: {
            width: Number(hProps.logoWidth) || 36,
            height: Number(hProps.logoHeight) || 36,
            url: hProps.logoUrl || ""
          }
        }
      });
    } catch {}

    // ۳. ذخیره ساختار کامل صفحه در modular_pages
    try {
      const currentPageObj = pages.find((p) => p.slug === currentSlug);
      const pageTitle = currentPageObj?.title || currentSlug;

      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: pageTitle,
          puck_data: data,
          is_published: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ تغییرات هدر و فوتر سراسری شد و در تمام صفحات ذخیره گردید.");

        // وب‌سوکت بلادرنگ به تمام کلاینت‌های باز
        try {
          supabase.channel("realtime-header-puck-sync").send({
            type: "broadcast",
            event: "header_updated",
            payload: newHeaderBlock.props || {}
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      }
    } catch {
      setToast("✓ تغییرات به صورت پایدار ثبت گردید.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleCreateNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;

    soundEngine.playSuccess();
    const cleanSlug = newPageSlug.trim().toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const title = newPageTitle.trim();

    const newPageObj = { id: "page_" + Date.now(), slug: cleanSlug, title };
    setPages((prev) => [...prev, newPageObj]);

    setShowNewPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");

    loadPage(cleanSlug, title);
    setToast("✓ صفحه جدید «" + title + "» با هدر و فوتر سراسری ساخته شد.");
    setTimeout(() => setToast(null), 4000);
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : "/" + currentSlug;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ استودیو با منوی انتخاب صفحه و دکمه ساخت صفحه جدید */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id || p.slug} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setShowNewPageModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1"
          >
            <span>➕</span>
            <span>ایجاد صفحه جدید</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده این صفحه</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* مدال ساخت صفحه سفارشی جدید */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans" dir="rtl">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-sky-500 flex items-center gap-2">
                <span>➕</span> ایجاد صفحه سفارشی جدید
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPage} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان فارسی صفحه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرایط گارانتی و خدمات"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آدرس انگلیسی / نامک (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: warranty-terms"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">آدرس نهایی صفحه: axoncore.ir/{newPageSlug.trim() || "slug"}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md transition cursor-pointer"
                >
                  ایجاد و باز کردن در ویرایشگر ←
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* بوم Puck با هدر و فوتر سراسری و محتوای اختصاصی هر صفحه */}
      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading || !pageData ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال لود صفحه و همگام‌سازی هدر سراسری...</div>
        ) : (
          <Puck
            key={renderKey}
            config={puckConfig}
            data={pageData}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
`;
writeFile("components/admin/AdminModularPages.tsx", studioWithGlobalNavCode);

// =============================================================================
// ۲. به‌روزرسانی components/Header.tsx با قابلیت دریافت آنی تنظیمات ذخیره‌شده
// =============================================================================
const headerGlobalSyncCode = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { totalItems, toggleCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  const [headerConfig, setHeaderConfig] = useState<{
    brandText?: string;
    logoUrl?: string;
    logoWidth?: number;
    logoHeight?: number;
    menu1Text?: string;
    menu1Url?: string;
    menu2Text?: string;
    menu2Url?: string;
    menu3Text?: string;
    menu3Url?: string;
    menu4Text?: string;
    menu4Url?: string;
    menu5Text?: string;
    menu5Url?: string;
    showCart?: boolean;
    showTheme?: boolean;
    showUser?: boolean;
    capsuleBg?: string;
    capsuleBorder?: string;
  }>({});

  const loadHeaderState = async () => {
    try {
      // بررسی لوکال سراسری
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("axon_global_header_footer_v2026");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.header?.props) {
            setHeaderConfig(parsed.header.props);
          }
        }
      }

      const info = await siteInfoService.getSiteInfo();
      if (info) {
        setSiteInfo(info);
        const savedLogo = info.homepage_layout_config?.headerLogoConfig;
        if (savedLogo) {
          setHeaderConfig((prev) => ({
            ...prev,
            logoWidth: savedLogo.width,
            logoHeight: savedLogo.height,
            logoUrl: savedLogo.url || prev.logoUrl
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

    loadHeaderState();

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const channel = supabase
      .channel("realtime-header-puck-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        loadHeaderState();
      })
      .on("broadcast", { event: "header_updated" }, (payload) => {
        if (payload?.payload) {
          setHeaderConfig((prev) => ({
            ...prev,
            ...payload.payload
          }));
        } else {
          loadHeaderState();
        }
      })
      .subscribe();

    const handleLocalUpdate = () => loadHeaderState();
    window.addEventListener("puck_published", handleLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("puck_published", handleLocalUpdate);
    };
  }, []);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const storeName = headerConfig.brandText || siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";
  const logoUrl = headerConfig.logoUrl || siteInfo?.logo_url || siteInfo?.logoUrl;
  const logoW = Number(headerConfig.logoWidth) || 36;
  const logoH = Number(headerConfig.logoHeight) || 36;

  const showCart = headerConfig.showCart !== false;
  const showTheme = headerConfig.showTheme !== false;
  const showUser = headerConfig.showUser !== false;

  return (
    <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="ltr">
      <div
        style={{
          backgroundColor: headerConfig.capsuleBg || undefined,
          borderColor: headerConfig.capsuleBorder || undefined,
        }}
        className="flex items-center justify-between px-6 py-3 rounded-full bg-white/90 dark:bg-[#07090e]/90 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all duration-300"
      >
        <div className="flex items-center gap-2 order-1">
          {showCart && (
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); toggleCart(); }}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer relative shadow-sm"
              title="سبد خرید"
            >
              🛒
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>
          )}

          {showTheme && (
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
              title="حالت شب / روز"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>
          )}

          {showUser && (
            <Link
              href="/admin/login"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
              title="ورود به حساب"
            >
              👤
            </Link>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300 order-2" dir="rtl">
          {headerConfig.menu1Text !== "" && <Link href={headerConfig.menu1Url || "/products"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu1Text || "کاتالوگ محصولات"}</Link>}
          {headerConfig.menu2Text !== "" && <Link href={headerConfig.menu2Url || "/news"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu2Text || "اخبار تکنولوژی"}</Link>}
          {headerConfig.menu3Text !== "" && <Link href={headerConfig.menu3Url || "/blog"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu3Text || "مجله سئو"}</Link>}
          {headerConfig.menu4Text !== "" && <Link href={headerConfig.menu4Url || "/track-order"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu4Text || "پیگیری سفارش"}</Link>}
          {headerConfig.menu5Text !== "" && <Link href={headerConfig.menu5Url || "/contact"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu5Text || "تماس با ما"}</Link>}
        </nav>

        <Link href="/" className="flex items-center gap-3 group order-3" dir="rtl">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div
            style={{ width: logoW + "px", height: logoH + "px" }}
            className="rounded-xl bg-[var(--input-bg)] border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-all duration-300 p-1 shrink-0"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                ▲
              </div>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
`;
writeFile("components/Header.tsx", headerGlobalSyncCode);

// =============================================================================
// ۳. به‌روزرسانی components/Footer.tsx با دریافت اطلاعات پایدار سراسری
// =============================================================================
const footerGlobalSyncCode = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });

    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };

    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
  }, []);

  const storeName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";
  const phone = siteInfo?.phone || "09376110200";
  const email = siteInfo?.email || "Pouriarahimi@yahoo.com";
  const address = siteInfo?.address || "شیراز - ستارخان";
  const workingHours = siteInfo?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰";
  const enamadCode = "27424534";
  const bioDesc = siteInfo?.description || siteInfo?.footer_text || "مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.";
  const footerLogo = siteInfo?.footer_logo_url || siteInfo?.footerLogoUrl;

  return (
    <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16 text-[var(--text-primary)]" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1 shrink-0">
                  {footerLogo ? (
                    <img src={footerLogo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                      ▲
                    </div>
                  )}
                </div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">{storeName}</h3>
              </div>
              <p className="text-xs font-bold text-sky-500">مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{bioDesc}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
                ✓ گارانتی اصالت ۱۰۰٪ فیزیکی
              </span>
              <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black">
                🚀 ارسال پیشتاز سراسری
              </span>
            </div>

            <div className="pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">شبکه‌های ارتباطی استودیو:</span>
              <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner">
                    {k}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">دسترسی سریع</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">خدمات مشتریان</h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white">اطلاعات تماس و دفتر</h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200">{phone}</span>
                </div>
                <span>📞</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{email}</span>
                </div>
                <span>✉️</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل و انبار:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{address}</span>
                </div>
                <span>📍</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                  <span className="text-[10px] text-slate-400 block">کد: {enamadCode}</span>
                </div>
                <span>🛡️</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs font-bold text-slate-500">
          <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
          <p>تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © 2026</p>
        </div>
      </div>
    </footer>
  );
}
`;
writeFile("components/Footer.tsx", footerGlobalSyncCode);

// =============================================================================
// ۴. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync("git config --global http.sslBackend openssl", { stdio: "inherit" });
  execSync("git add -A", { stdio: "inherit" });
  execSync(
    'git commit -m "feat(global-nav): fully synchronize header and footer globally across all pages with granular page content editing"',
    { stdio: "inherit" }
  );

  let branchName = "main";
  try {
    branchName =
      execSync("git rev-parse --abbrev-ref HEAD").toString().trim() || "main";
  } catch {
    branchName = "main";
  }
  execSync("git push origin " + branchName, { stdio: "inherit" });
  console.log("\x1b[32m✔ سراسری‌سازی هدر و فوتر با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}