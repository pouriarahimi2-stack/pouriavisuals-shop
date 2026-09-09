/**
 * AXON CORE - Live Header & Footer Dynamic Bridge Engine (fix.js)
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

console.log("\x1b[36m[AXON-HEADER-FOOTER-LIVE]\x1b[0m متصل‌سازی هدر و فوتر اصلی به پایگاه داده و امکان ویرایش زنده تک‌تک اجزا...");

// =============================================================================
// ۱. بازنویسی پویا و کامل components/Header.tsx
// =============================================================================
const dynamicHeaderCode = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";

export default function Header() {
  const { totalItems, toggleCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    setMounted(true);
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const handleUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };

    window.addEventListener("site_info_updated", handleUpdate);
    return () => window.removeEventListener("site_info_updated", handleUpdate);
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

  const storeName = siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";
  const navItems = siteInfo?.homepage_layout_config?.headerNavLinks || [
    { title: "کاتالوگ محصولات", url: "/products" },
    { title: "اخبار تکنولوژی", url: "/news" },
    { title: "مجله سئو", url: "/blog" },
    { title: "پیگیری سفارش", url: "/track-order" },
    { title: "تماس با ما", url: "/contact" },
  ];

  return (
    <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="rtl">
      <div className="flex items-center justify-between px-6 py-3 rounded-full bg-[var(--modal-bg,#ffffff)]/80 dark:bg-[#07090e]/80 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all">
        
        {/* ابزارهای سمت چپ (سبد خرید، تغییر تم، ورود کاربر) */}
        <div className="flex items-center gap-2">
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
            title="ورود به پنل"
          >
            👤
          </Link>
        </div>

        {/* منوهای ناوبری */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300">
          {navItems.map((item: any, idx: number) => (
            <Link
              key={idx}
              href={item.url || "/"}
              className="hover:text-sky-500 transition cursor-pointer"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* نام برند و آیکون اختصاصی */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs group-hover:scale-105 transition">
            ▲
          </div>
        </Link>

      </div>
    </header>
  );
}
`;
writeFile('components/Header.tsx', dynamicHeaderCode);

// =============================================================================
// ۲. بازنویسی پویا و کامل components/Footer.tsx
// =============================================================================
const dynamicFooterCode = `"use client";

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

  return (
    <footer className="w-full bg-[var(--modal-bg,#ffffff)] dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-sans select-none mt-16" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* گرید ۴ ستونه دقیقاً مشابه تصویر شما */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          
          {/* ستون ۱ (راست): معرفی برند، نشان‌ها و داک تعاملی CONTACT */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-xs">
                  ▲
                </div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white">{storeName}</h3>
              </div>
              <p className="text-xs font-bold text-sky-500">مرجع تخصصی تجهیزات کالیبراسیون و مانیتورهای ۵K استودیو</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">{bioDesc}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                <span>✓</span> گارانتی اصالت ۱۰۰٪ فیزیکی
              </span>
              <span className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-black flex items-center gap-1.5">
                <span>🚀</span> ارسال پیشتاز سراسری
              </span>
            </div>

            {/* کلیدهای ۳D تعاملی CONTACT */}
            <div className="pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> شبکه‌های ارتباطی و اجتماعی استودیو:
              </span>
              <div className="p-3 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-2 shadow-2xl" dir="ltr">
                {["C", "O", "N", "T", "A", "C", "T"].map((k, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-xs shadow-inner hover:scale-110 hover:border-sky-400 transition cursor-pointer">
                    {k}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center text-slate-400">برای مشاهده امکانات، ماوس را روی کلیدها ببرید یا کلیک کنید</p>
            </div>
          </div>

          {/* ستون ۲: دسترسی سریع */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> دسترسی سریع
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/products" className="hover:text-sky-500 transition">کاتالوگ کالاها</Link></li>
              <li><Link href="/track-order" className="hover:text-sky-500 transition">سامانه رهگیری مرسولات</Link></li>
              <li><Link href="/news" className="hover:text-sky-500 transition">جدیدترین اخبار تکنولوژی</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">مجله مقالات تخصصی</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">درباره آکسون</Link></li>
            </ul>
          </div>

          {/* ستون ۳: خدمات مشتریان */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> خدمات مشتریان
            </h4>
            <ul className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <li><Link href="/contact" className="hover:text-sky-500 transition">ثبت تیکت مشاوره</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">شرایط گارانتی طلایی</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">ضمانت بازگشت وجه ۷ روزه</Link></li>
              <li><Link href="/blog" className="hover:text-sky-500 transition">راهنمای کالیبراسیون ۵K</Link></li>
              <li><Link href="/about" className="hover:text-sky-500 transition">روش‌های پرداخت امن شاپرک</Link></li>
            </ul>
          </div>

          {/* ستون ۴: اطلاعات تماس و نماد اینماد */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> اطلاعات تماس و دفتر
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">تلفن پشتیبانی:</span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200">{phone}</span>
                </div>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 text-sm">📞</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">پست الکترونیک:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{email}</span>
                </div>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 text-sm">✉️</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">نشانی تحویل حضوری و انبار:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{address}</span>
                </div>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-sm">📍</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ساعات پاسخگویی:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{workingHours}</span>
                </div>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-sm">⏰</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">نماد اعتماد الکترونیکی</span>
                  <span className="text-[10px] text-slate-400 block">کد رسمی: <strong className="font-mono text-sky-500">{enamadCode}</strong></span>
                </div>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">🛡️</span>
              </div>
            </div>
          </div>

        </div>

        {/* خط کپی‌رایت انتهای فوتر */}
        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>نماد اعتماد الکترونیکی فعال ({enamadCode})</span>
            <span className="text-slate-400">•</span>
            <span>طراحی و معماری مهندسی پایدار</span>
          </div>
          <p className="text-center sm:text-left text-[11px]">
            تمامی حقوق مادی و معنوی برای {storeName} محفوظ است © 2026
          </p>
        </div>

      </div>
    </footer>
  );
}
`;
writeFile('components/Footer.tsx', dynamicFooterCode);

// =============================================================================
// ۳. ارتقای components/admin/AdminModularPages.tsx برای کنترل زنده هدر و فوتر
// =============================================================================
const studioFullControl = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Render, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { siteInfoService } from "@/services/siteInfoService";

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [activeTab, setActiveTab] = useState<"page_canvas" | "header_footer_editor">("page_canvas");
  const [pageData, setPageData] = useState<Data>({ content: [], root: { props: { title: "صفحه" } } });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "split" | "live_site">("split");
  const [viewportWidth, setViewportWidth] = useState<"100%" | "768px" | "390px">("100%");
  const [toast, setToast] = useState<string | null>(null);

  // استیت‌های ویرایش هدر و فوتر زنده
  const [brandName, setBrandName] = useState("Axon | آکسون");
  const [phone, setPhone] = useState("09376110200");
  const [email, setEmail] = useState("Pouriarahimi@yahoo.com");
  const [address, setAddress] = useState("شیراز - ستارخان");
  const [workingHours, setWorkingHours] = useState("شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
  const [bioText, setBioText] = useState("مرجع تخصصی تامین، کالیبراسیون و مشاوره سخت‌افزارهای حرفه‌ای تصویر در ایران با ۱۸ ماه گارانتی اصالت طلایی.");

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const loadHeaderFooterData = async () => {
    const info = await siteInfoService.getSiteInfo();
    if (info) {
      setBrandName(info.site_name || info.siteName || "Axon | آکسون");
      setPhone(info.phone || "09376110200");
      setEmail(info.email || "Pouriarahimi@yahoo.com");
      setAddress(info.address || "شیراز - ستارخان");
      setWorkingHours(info.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰");
      setBioText(info.description || info.footer_text || "");
    }
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data && json.page.puck_data.content?.length > 0) {
        setPageData(json.page.puck_data);
      } else {
        setPageData({
          content: [
            { type: "NativeHero3D", props: { id: "hero-1", topBadge: "🚀 مانیتورهای ۵K", bgColor: "transparent" } },
            { type: "NativePerspectiveSlider", props: { id: "slider-1", paddingY: 20 } },
            { type: "NativeProductCatalog", props: { id: "catalog-1", heading: "کاتالوگ تجهیزات" } },
            { type: "NativeExplodedView", props: { id: "exploded-1", productTitle: "Apple Studio Display 5K Retina" } }
          ],
          root: { props: { title: slug } }
        });
      }
    } catch {
      setPageData({ content: [], root: { props: { title: slug } } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    loadPage("home");
    loadHeaderFooterData();
  }, []);

  const handleSavePage = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات روی سایت...");
    try {
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
        setToast("✓ تمامی بلوک‌های بدنه ذخیره و منتشر شد.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleSaveHeaderFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setToast("در حال ذخیره و انتشار سراسری هدر و فوتر...");
    try {
      await siteInfoService.updateSiteInfo({
        site_name: brandName,
        phone,
        email,
        address,
        working_hours: workingHours,
        description: bioText,
        footer_text: bioText,
      });
      soundEngine.playSuccess();
      setToast("✓ هدر کپسولی و فوتر ۴ ستونه در تمام صفحات سایت به‌روزرسانی شد!");
    } catch {
      setToast("خطا در ذخیره‌سازی اطلاعات هدر و فوتر.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const targetLiveUrl = currentSlug === "home" ? "/" : \`/\${currentSlug}\`;

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4 text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ هوشمند با سوییچ حالت ادیتور */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); setActiveTab("page_canvas"); }}
              className={\`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer \${
                activeTab === "page_canvas" ? "bg-sky-500 text-white shadow-md" : "bg-[var(--input-bg)] text-slate-400"
              }\`}
            >
              🧱 ویرایش بدنه صفحات
            </button>

            <button
              type="button"
              onClick={() => { soundEngine.playClick(); setActiveTab("header_footer_editor"); }}
              className={\`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer \${
                activeTab === "header_footer_editor" ? "bg-sky-500 text-white shadow-md" : "bg-[var(--input-bg)] text-slate-400"
              }\`}
            >
              🧭 ویرایش هدر کپسولی و فوتر ۴ ستونه
            </button>
          </div>
        </div>

        {activeTab === "page_canvas" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={targetLiveUrl}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* ۱. محیط ویرایشگر هدر و فوتر به همراه پیش‌نمایش کاملاً زنده */}
      {activeTab === "header_footer_editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* فرم ویرایش تک‌تک بخش‌های هدر و فوتر */}
          <form onSubmit={handleSaveHeaderFooter} className="lg:col-span-5 p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4 text-xs shadow-xl">
            <h3 className="font-black text-sm text-sky-500 border-b border-[var(--card-border)] pb-3">
              ✏️ کنترل اختصاصی مشخصات هدر و فوتر
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نام برند (لوگو هدر و فوتر):</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">تلفن پشتیبانی فوتر:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ایمیل پشتیبانی:</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نشانی تحویل حضوری و انبار:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ساعات پاسخگویی:</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">متن معرفی و گارانتی استودیو در فوتر:</label>
                <textarea
                  rows={3}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition shadow-xl cursor-pointer"
              >
                💾 ذخیره و انتشار در سراسر سایت
              </button>
            </div>
          </form>

          {/* پیش‌نمایش ۱۰۰٪ واقعی هدر و فوتر در بوم */}
          <div className="lg:col-span-7 rounded-3xl border border-[var(--card-border)] bg-[var(--modal-bg)] p-4 shadow-2xl space-y-6">
            <span className="text-xs font-black text-emerald-500 block px-2">
              👁️ پیش‌نمایش رندر واقعی و زنده هدر و فوتر سایت:
            </span>
            <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 p-2 space-y-8">
              <Header />
              <div className="py-12 text-center text-slate-500 font-bold text-xs border-y border-white/5">
                (محتوا و بدنه صفحات سایت در این میان رندر می‌شود)
              </div>
              <Footer />
            </div>
          </div>
        </div>
      )}

      {/* ۲. محیط ویرایشگر بدنه صفحات Puck */}
      {activeTab === "page_canvas" && (
        <div className="flex-1 w-full min-h-[750px] flex gap-4 items-start">
          <div className="w-1/2 rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px]">
            <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-sky-400 flex items-center gap-2">
              <span>🛠️ چیدمان بلوک‌های بدنه صفحه</span>
            </div>
            <Puck
              config={puckConfig}
              data={pageData}
              onChange={(newData) => setPageData(newData)}
              onPublish={handleSavePage}
            />
          </div>

          <div className="w-1/2 rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px] flex flex-col">
            <div className="p-2.5 bg-black/40 border-b border-white/10 px-4 text-xs font-bold text-emerald-400 flex justify-between items-center">
              <span>پیش‌نمایش کامل صفحه با هدر و فوتر واقعی</span>
              <span className="text-[10px] font-mono text-slate-400">{targetLiveUrl}</span>
            </div>

            <div className="flex-1 w-full bg-[#07090e] overflow-y-auto p-2">
              <Header />
              <div className="py-4">
                <Render config={puckConfig} data={pageData} />
              </div>
              <Footer />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;
writeFile('components/admin/AdminModularPages.tsx', studioFullControl);

// =============================================================================
// ۴. بیلد و ارسال قطعی به گیت‌هاب و ورسل
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
  execSync('git commit -m "feat(header-footer-sync): make exact Header and Footer completely dynamic and editable live in studio"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ اتصال کامل هدر و فوتر با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}