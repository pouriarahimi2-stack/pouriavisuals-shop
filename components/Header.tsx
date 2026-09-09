"use client";

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
