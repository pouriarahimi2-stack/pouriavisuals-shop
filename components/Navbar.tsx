"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { MenuItem } from "@/components/AdminMenu";

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const info = await siteInfoService.getAll();
        setSiteInfo(info);

        const localMenu = localStorage.getItem("site_menu_items");
        if (localMenu) {
          setMenuItems(JSON.parse(localMenu));
        } else {
          setMenuItems([
            { id: "1", title: "صفحه نخست", url: "/", order: 1, isActive: true },
            { id: "2", title: "کاتالوگ محصولات", url: "/#products", order: 2, isActive: true },
            { id: "3", title: "پیگیری مرسوله پستی", url: "/track-order", order: 3, isActive: true },
            { id: "4", title: "مجله و مقالات سئو", url: "/blog", order: 4, isActive: true },
            { id: "5", title: "تماس با پشتیبانی", url: "/contact", order: 5, isActive: true },
          ]);
        }
      } catch (e) {
        console.error("Navbar load data error:", e);
      }
    }
    loadData();

    const handleMenuSync = (e: any) => {
      if (e.detail) setMenuItems(e.detail);
    };

    const handleSiteSync = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };

    window.addEventListener("menu_updated", handleMenuSync);
    window.addEventListener("site_info_updated", handleSiteSync);

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));

    return () => {
      window.removeEventListener("menu_updated", handleMenuSync);
      window.removeEventListener("site_info_updated", handleSiteSync);
    };
  }, []);

  const toggleTheme = () => {
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

  const activeLinks = menuItems.filter((m) => m.isActive !== false);
  const logoSrc = siteInfo?.logo_url || (siteInfo as any)?.logoUrl;
  const storeName = siteInfo?.site_name || siteInfo?.siteName || "پوریا ویژوالز";
  const tagline = siteInfo?.tagline || "مرجع تخصصی مانیتور و تجهیزات بصری";

  return (
    <nav className="sticky top-0 z-40 bg-[var(--modal-bg)]/90 backdrop-blur-2xl border-b border-[var(--card-border)] font-sans select-none text-[var(--text-primary)] transition-colors duration-300 shadow-sm" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        
        {/* لوگو بزرگ‌تر و نام فروشگاه */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="w-14 h-14 object-contain rounded-2xl shadow-md group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-105 transition duration-300">
                ⚡
              </div>
            )}
            <div>
              <h1 className="font-black text-base md:text-lg leading-tight tracking-tight">
                {storeName}
              </h1>
              <span className="text-[11px] text-[var(--text-secondary)] font-semibold block mt-0.5">
                {tagline}
              </span>
            </div>
          </Link>
        </div>

        {/* منوی پیوندهای دسکتاپ (کاملاً مرتب و استایل‌بندی شده) */}
        <div className="hidden md:flex items-center gap-2 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] shadow-inner">
          {activeLinks.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="px-4 py-2 rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-blue)] transition-all duration-300"
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* دکمه‌های تم، سبد خرید و منوی موبایل */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm hover:border-[var(--accent-blue)] transition cursor-pointer shadow-sm"
            title="تغییر حالت شب و روز"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg flex items-center gap-2.5 cursor-pointer active:scale-95"
          >
            <span className="text-base">🛒</span>
            <span className="hidden sm:inline">سبد خرید</span>
            {totalItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[var(--accent-blue)] flex items-center justify-center font-mono font-black text-[10px] shadow">
                {totalItems}
              </span>
            )}
          </button>

          {/* دکمه منوی موبایل */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm cursor-pointer"
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* منوی کشویی موبایل */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--card-border)] p-4 bg-[var(--modal-bg)] space-y-2 animate-fadeIn">
          {activeLinks.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3.5 rounded-2xl bg-[var(--input-bg)] font-black text-xs text-[var(--text-primary)] hover:border-[var(--accent-blue)] border border-transparent transition"
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}