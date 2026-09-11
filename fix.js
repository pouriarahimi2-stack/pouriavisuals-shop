/**
 * AXON CORE - Fix Header Logo Dimensions & Puck Sync (fix.js)
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

console.log("\x1b[36m[AXON-FIX]\x1b[0m اتصال مستقیم ابعاد لوگوی هدر به داده‌های ذخیره‌شده در صفحه ساز...");

// =============================================================================
// ۱. بازنویسی components/Header.tsx با دریافت لحظه‌ای تنظیمات Puck
// =============================================================================
const fixedHeaderCode = `"use client";

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

  // استیت‌های اختصاصی Puck برای هدر
  const [headerConfig, setHeaderConfig] = useState<{
    brandText?: string;
    logoUrl?: string;
    logoWidth?: number;
    logoHeight?: number;
    capsuleBg?: string;
    capsuleBorder?: string;
  }>({});

  const loadPuckHeaderData = async () => {
    try {
      const res = await fetch("/api/pages?slug=home", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page?.puck_data?.content) {
        const headerBlock = json.page.puck_data.content.find(
          (b: any) => b.type === "HeaderCapsuleBar"
        );
        if (headerBlock?.props) {
          setHeaderConfig(headerBlock.props);
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    const cached = siteInfoService.getSiteInfoSync();
    if (cached) setSiteInfo(cached);

    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });

    loadPuckHeaderData();

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const handleSiteUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
      loadPuckHeaderData();
    };

    window.addEventListener("site_info_updated", handleSiteUpdate);
    window.addEventListener("puck_published", loadPuckHeaderData);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteUpdate);
      window.removeEventListener("puck_published", loadPuckHeaderData);
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

  return (
    <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="ltr">
      <div
        style={{
          backgroundColor: headerConfig.capsuleBg || undefined,
          borderColor: headerConfig.capsuleBorder || undefined,
        }}
        className="flex items-center justify-between px-6 py-3 rounded-full bg-white/90 dark:bg-[#07090e]/90 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all"
      >
        {/* سمت چپ: ابزارهای کاربری */}
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

        {/* وسط: منوهای ناوبری */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300 order-2" dir="rtl">
          <Link href="/products" className="hover:text-sky-500 transition cursor-pointer">کاتالوگ محصولات</Link>
          <Link href="/news" className="hover:text-sky-500 transition cursor-pointer">اخبار تکنولوژی</Link>
          <Link href="/blog" className="hover:text-sky-500 transition cursor-pointer">مجله سئو</Link>
          <Link href="/track-order" className="hover:text-sky-500 transition cursor-pointer">پیگیری سفارش</Link>
          <Link href="/contact" className="hover:text-sky-500 transition cursor-pointer">تماس با ما</Link>
        </nav>

        {/* سمت راست: لوگو با اعمال مستقیم ابعاد درخواستی */}
        <Link href="/" className="flex items-center gap-3 group order-3" dir="rtl">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div
            style={{ width: logoW + 'px', height: logoH + 'px' }}
            className="rounded-xl bg-[var(--input-bg)] border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition p-1 shrink-0"
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
writeFile('components/Header.tsx', fixedHeaderCode);

// =============================================================================
// ۲. به‌روزرسانی components/admin/AdminModularPages.tsx جهت ارسال ایونت آنی ذخیره‌سازی
// =============================================================================
const adminModularPagesPath = path.join(process.cwd(), 'components/admin/AdminModularPages.tsx');
let adminModularCode = fs.readFileSync(adminModularPagesPath, 'utf8');

if (!adminModularCode.includes('puck_published')) {
  adminModularCode = adminModularCode.replace(
    'soundEngine.playSuccess();',
    'soundEngine.playSuccess();\n        if (typeof window !== "undefined") window.dispatchEvent(new Event("puck_published"));'
  );
  writeFile('components/admin/AdminModularPages.tsx', adminModularCode);
}

// =============================================================================
// ۳. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
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
  execSync('git commit -m "fix(header-puck-sync): dynamically apply logo width and height from puck store to live header"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ اعمال ابعاد لوگو با موفقیت منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}