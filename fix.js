/**
 * AXON CORE - Fix Logo Dimensions Persistence on Refresh (fix.js)
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

console.log("\x1b[36m[AXON-PERSISTENCE-FIX]\x1b[0m تضمین ذخیره دائمی ابعاد لوگو پس از رفرش در دیتابیس و استیت ادمین...");

// =============================================================================
// ۱. بازنویسی components/admin/AdminModularPages.tsx با نگه‌داری پایدار مقادیر
// =============================================================================
const persistentAdminModularPages = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { siteInfoService } from "@/services/siteInfoService";
import Link from "next/link";

const BASE_INITIAL_DATA: Data = {
  content: [
    {
      type: "HeaderCapsuleBar",
      props: {
        id: "header-capsule-1",
        brandText: "Axon | آکسون",
        logoUrl: "",
        logoWidth: 36,
        logoHeight: 36,
        capsuleBg: "rgba(7, 9, 14, 0.9)",
        capsuleBorder: "rgba(255, 255, 255, 0.12)",
        paddingY: 10
      }
    },
    {
      type: "NativeHero3D",
      props: {
        id: "hero-1",
        topBadge: "🚀 مرجع تخصصی مانیتورهای ۵K استودیو",
        badgeColor: "#38bdf8",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        titleSize: 42,
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        bgColor: "transparent",
        paddingTop: 40,
        paddingBottom: 20
      }
    },
    {
      type: "NativePerspectiveSlider",
      props: {
        id: "slider-1",
        sectionTitle: "نمایشگاه سه‌بعدی تجهیزات پرچمدار",
        sectionSubtitle: "پیمایش لمسی جهت بررسی دقیق مشخصات و گارانتی",
        paddingY: 20
      }
    },
    {
      type: "NativeProductCatalog",
      props: {
        id: "catalog-1",
        heading: "کاتالوگ تجهیزات تخصصی و مانیتورها",
        subtitle: "تمامی کالاها با گارانتی اصالت طلایی و تست سلامت فیزیکی عرضه می‌شوند",
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
    },
    {
      type: "GlobalFooterBlock",
      props: {
        id: "footer-1",
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
    }
  ],
  root: { props: { title: "صفحه اصلی" } }
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(BASE_INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      // ۱. ابتدا تنظیمات ذخیره‌شده مستقیم دیتابیس را می‌خوانیم
      const siteInfo = await siteInfoService.getSiteInfo();

      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();

      let targetData: Data = BASE_INITIAL_DATA;

      if (json.success && json.page && json.page.puck_data && Array.isArray(json.page.puck_data.content) && json.page.puck_data.content.length > 0) {
        targetData = json.page.puck_data;
      }

      // تضمین بازگردانی ابعاد لوگو حتی اگر Puck ناقص ذخیره کرده باشد
      const headerIndex = targetData.content.findIndex((b: any) => b.type === "HeaderCapsuleBar");
      if (headerIndex !== -1 && siteInfo?.homepage_layout_config?.headerLogoConfig) {
        const savedLogo = siteInfo.homepage_layout_config.headerLogoConfig;
        targetData.content[headerIndex].props = {
          ...targetData.content[headerIndex].props,
          logoWidth: savedLogo.width || targetData.content[headerIndex].props.logoWidth || 36,
          logoHeight: savedLogo.height || targetData.content[headerIndex].props.logoHeight || 36,
          logoUrl: savedLogo.url || targetData.content[headerIndex].props.logoUrl || "",
        };
      }

      setPageData(targetData);
    } catch {
      setPageData(BASE_INITIAL_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات روی سایت...");

    try {
      // استخراج تنظیمات لوگوی هدر
      const headerBlock = data.content?.find((b: any) => b.type === "HeaderCapsuleBar");
      const logoW = Number(headerBlock?.props?.logoWidth) || 36;
      const logoH = Number(headerBlock?.props?.logoHeight) || 36;
      const logoU = headerBlock?.props?.logoUrl || "";

      // ذخیره دائمی در site_info جهت حفظ ۱۰۰٪ پس از رفرش
      const currentInfo = await siteInfoService.getSiteInfo();
      await siteInfoService.updateSiteInfo({
        homepage_layout_config: {
          ...(currentInfo?.homepage_layout_config || {}),
          headerLogoConfig: {
            width: logoW,
            height: logoH,
            url: logoU
          }
        }
      });

      // ذخیره درخت ساختار Puck در modular_pages
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: currentSlug === "home" ? "صفحه اصلی" : currentSlug,
          puck_data: data,
          is_published: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ ابعاد لوگو و تنظیمات صفحه با موفقیت ذخیره دائم شد.");

        // برودکست وب‌سوکت بلادرنگ به تمام تب‌ها
        try {
          supabase.channel("realtime-header-puck-sync").send({
            type: "broadcast",
            event: "header_updated",
            payload: {
              ...(headerBlock?.props || {}),
              logoWidth: logoW,
              logoHeight: logoH
            }
          });
        } catch {}

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("puck_published"));
        }
      } else {
        setToast("خطا در ذخیره‌سازی.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : \`/\${currentSlug}\`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
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
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      <div className="w-full rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[880px]">
        {loading ? (
          <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم بصری و فراخوانی ابعاد ذخیره‌شده...</div>
        ) : (
          <Puck
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
writeFile('components/admin/AdminModularPages.tsx', persistentAdminModularPages);

// =============================================================================
// ۲. همگام‌سازی مستقیم components/Header.tsx با مقادیر پایدار دیتابیس
// =============================================================================
const stableHeaderCode = `"use client";

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
    capsuleBg?: string;
    capsuleBorder?: string;
  }>({});

  const loadHeaderState = async () => {
    try {
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

      const res = await fetch("/api/pages?slug=home", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page?.puck_data?.content) {
        const headerBlock = json.page.puck_data.content.find(
          (b: any) => b.type === "HeaderCapsuleBar"
        );
        if (headerBlock?.props) {
          setHeaderConfig((prev) => ({
            ...prev,
            ...headerBlock.props
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
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        loadHeaderState();
      })
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

  const savedLogoConfig = siteInfo?.homepage_layout_config?.headerLogoConfig;
  const storeName = headerConfig.brandText || siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";
  const logoUrl = headerConfig.logoUrl || savedLogoConfig?.url || siteInfo?.logo_url || siteInfo?.logoUrl;
  const logoW = Number(headerConfig.logoWidth || savedLogoConfig?.width || 36);
  const logoH = Number(headerConfig.logoHeight || savedLogoConfig?.height || 36);

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

          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
            title="حالت شب / روز"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <Link
            href="/admin/login"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
            title="ورود به حساب"
          >
            👤
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300 order-2" dir="rtl">
          <Link href="/products" className="hover:text-sky-500 transition cursor-pointer">کاتالوگ محصولات</Link>
          <Link href="/news" className="hover:text-sky-500 transition cursor-pointer">اخبار تکنولوژی</Link>
          <Link href="/blog" className="hover:text-sky-500 transition cursor-pointer">مجله سئو</Link>
          <Link href="/track-order" className="hover:text-sky-500 transition cursor-pointer">پیگیری سفارش</Link>
          <Link href="/contact" className="hover:text-sky-500 transition cursor-pointer">تماس با ما</Link>
        </nav>

        <Link href="/" className="flex items-center gap-3 group order-3" dir="rtl">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div
            style={{ width: logoW + 'px', height: logoH + 'px' }}
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
writeFile('components/Header.tsx', stableHeaderCode);

// =============================================================================
// ۳. بیلد پروژه و ارسال قطعی به گیت‌هاب و استقرار در ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(persistence): permanently persist header logo width & height in site_info & puck store across full page reloads"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ ذخیره دائمی ابعاد لوگو با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}