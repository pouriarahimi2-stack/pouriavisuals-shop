// File Path: components/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { menuService, MenuItem } from "@/services/menuService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const fetchNavbarData = async () => {
    try {
      const [info, menus] = await Promise.all([
        siteInfoService.getSiteInfo(),
        menuService.getAll(),
      ]);
      if (info) setSiteInfo(info);
      if (menus) {
        setMenuItems(menus.filter((m: any) => m.isActive !== false && m.is_active !== false));
      }
    } catch (e) {
      console.error("Navbar realtime load error:", e);
    }
  };

  useEffect(() => {
    fetchNavbarData();

    const navbarChannel = supabase
      .channel("navbar-realtime-sync-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchNavbarData())
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => fetchNavbarData())
      .subscribe();

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));

    return () => {
      supabase.removeChannel(navbarChannel);
    };
  }, []);

  const toggleTheme = () => {
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

  const activeLinks =
    menuItems.length > 0
      ? menuItems
      : [
          { id: "1", title: "صفحه نخست", url: "/", order: 1, isActive: true },
          { id: "2", title: "کاتالوگ محصولات", url: "/#products", order: 2, isActive: true },
          { id: "3", title: "📡 جدیدترین اخبار تکنولوژی", url: "/news", order: 3, isActive: true },
          { id: "4", title: "پیگیری مرسوله", url: "/track-order", order: 4, isActive: true },
          { id: "5", title: "مجله و مقالات سئو", url: "/blog", order: 5, isActive: true },
          { id: "6", title: "تماس با ما", url: "/contact", order: 6, isActive: true },
        ];

  const logoSrc = siteInfo?.logo_url || (siteInfo as any)?.logoUrl;
  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const tagline = siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال و استودیو";

  return (
    <nav className="sticky top-0 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border-b border-[var(--card-border)] font-sans select-none text-[var(--text-primary)] transition-colors duration-300 shadow-md" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        
        {/* لوگو و نام فروشگاه */}
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
              {logoSrc ? (
                <img src={logoSrc} alt={storeName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-black text-[var(--accent-blue)]">⚡</span>
              )}
            </div>
            <div>
              <h1 className="font-black text-base leading-tight tracking-tight text-[var(--text-primary)]">
                {storeName}
              </h1>
              <span className="text-[11px] text-[var(--accent-blue)] font-bold block mt-0.5">
                {tagline}
              </span>
            </div>
          </Link>
        </div>

        {/* منو در دسکتاپ */}
        <div className="hidden lg:flex items-center gap-1 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] shadow-inner">
          {activeLinks.map((item: any) => (
            <Link
              key={item.id}
              href={item.url || item.href}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition-all duration-200"
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* دکمه‌های تم و سبد خرید */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm flex items-center justify-center"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setIsCartOpen(true);
            }}
            className="relative h-11 px-4 sm:px-5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">🛒</span>
            <span className="hidden sm:inline">سبد خرید</span>
            {totalItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[var(--accent-blue)] flex items-center justify-center font-mono font-black text-[10px] shadow">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="lg:hidden p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--card-border)] p-4 bg-[var(--modal-bg)] space-y-2 animate-fadeIn">
          {activeLinks.map((item: any) => (
            <Link
              key={item.id}
              href={item.url || item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-2xl bg-[var(--input-bg)] font-black text-xs text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-white transition"
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}