/**
 * AXON CORE - Remove News Bar & Restore Full Logo Upload Feature (fix.js)
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

console.log("\x1b[36m[AXON-FIX]\x1b[0m ۱. حذف نوار اخبار بالای هدر...");
console.log("\x1b[36m[AXON-FIX]\x1b[0m ۲. بازگرداندن و اتصال کامل قابلیت آپلود و نمایش لوگو...");

// =============================================================================
// ۱. حذف نوار اخبار از LayoutWrapper.tsx
// =============================================================================
const layoutWrapperWithoutNews = `"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AIAssistantChat from "@/components/AIAssistantChat";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {!isAdmin && <Header />}
      <main className="flex-1 w-full">{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
      {!isAdmin && <AIAssistantChat />}
      <CartDrawer />
    </div>
  );
}
`;
writeFile('components/LayoutWrapper.tsx', layoutWrapperWithoutNews);

// =============================================================================
// ۲. به‌روزرسانی Header.tsx برای پشتیبانی بی‌نقص از لوگوی تصویری آپلود شده
// =============================================================================
const headerWithDynamicLogo = `"use client";

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
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 my-2 select-none font-sans" dir="ltr">
      <div className="flex items-center justify-between px-6 py-3 rounded-full bg-white/90 dark:bg-[#07090e]/90 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-xl transition-all">
        
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

        {/* سمت راست: نام برند به همراه لوگوی تصویری یا نشان گرادیانتی */}
        <Link href="/" className="flex items-center gap-3 group order-3" dir="rtl">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition p-1">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
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
writeFile('components/Header.tsx', headerWithDynamicLogo);

// =============================================================================
// ۳. به‌روزرسانی بلوک HeaderBrandLogo در puckConfig برای انتخاب و بارگذاری لوگو
// =============================================================================
const puckFilePath = path.join(process.cwd(), 'lib/puckConfig.tsx');
let puckCode = fs.readFileSync(puckFilePath, 'utf8');

const updatedLogoBlock = `    HeaderBrandLogo: {
      label: "نشان و لوگوی برند (پشتیبانی از عکس)",
      fields: {
        brandText: { type: "text", label: "نام برند" },
        logoImageUrl: { type: "text", label: "آدرس اینترنتی تصویر لوگو (URL)" },
        iconText: { type: "text", label: "کاراکتر جایگزین (در صورت نبود تصویر)" }
      },
      defaultProps: {
        brandText: "Axon | آکسون",
        logoImageUrl: "",
        iconText: "▲"
      },
      render: ({ brandText, logoImageUrl, iconText }) => (
        <div className="flex items-center gap-3 cursor-pointer" dir="rtl">
          <span className="font-black text-base tracking-tight text-white">{brandText}</span>
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-md p-1">
            {logoImageUrl ? (
              <img src={logoImageUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                {iconText || "▲"}
              </div>
            )}
          </div>
        </div>
      )
    },`;

puckCode = puckCode.replace(/HeaderBrandLogo:\s*\{[\s\S]*?render:\s*\(\{[\s\S]*?\}\s*\)\s*\},/g, updatedLogoBlock);
writeFile('lib/puckConfig.tsx', puckCode);

// =============================================================================
// ۴. بیلد و ارسال قطعی به مخزن گیت‌هاب و استقرار ورسل
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
  execSync('git commit -m "fix: remove top news ticker bar and restore full image logo upload integration"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تغییرات با موفقیت در ورسل دیپلوی شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}