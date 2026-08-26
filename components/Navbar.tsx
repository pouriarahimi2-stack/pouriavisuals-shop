// components/Navbar.tsx
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchNavbarData = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info) setSiteInfo(info);

      const menus = await menuService.getAll();
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
          { id: "3", title: "📡 رادار اخبار تکنولوژی", url: "/news", order: 3, isActive: true },
          { id: "4", title: "پیگیری مرسوله", url: "/track-order", order: 4, isActive: true },
          { id: "5", title: "مجله و مقالات", url: "/blog", order: 5, isActive: true },
          { id: "6", title: "تماس با ما", url: "/contact", order: 6, isActive: true },
        ];

  const logoSrc = siteInfo?.logo_url || (siteInfo as any)?.logoUrl;
  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const tagline = siteInfo?.tagline || "مرجع تخصصی تجهیزات دیجیتال";

  return (
    <nav className="sticky top-0 z-40 bg-[var(--modal-bg)]/95 backdrop-blur-2xl border-b border-[var(--card-border)] font-sans select-none text-[var(--text-primary)] transition-colors duration-300 shadow-md" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3.5 group">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="w-14 h-14 object-contain rounded-2xl shadow-lg bg-white/5 p-1 border border-[var(--card-border)] group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-2xl shadow-lg group-hover:scale-105 transition duration-300">
                ⚡
              </div>
            )}
            <div>
              <h1 className="font-black text-base md:text-lg leading-tight tracking-tight text-[var(--text-primary)]">
                {storeName}
              </h1>
              <span className="text-[11px] text-[var(--accent-blue)] font-bold block mt-0.5">
                {tagline}
              </span>
            </div>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] shadow-inner">
          {activeLinks.map((item: any) => (
            <Link
              key={item.id}
              href={item.url || item.href}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition-all duration-300"
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setIsCartOpen(true);
            }}
            className="relative px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-95 transition shadow-lg flex items-center gap-2.5 cursor-pointer active:scale-95"
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
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm cursor-pointer"
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

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