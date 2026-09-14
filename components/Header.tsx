// File Path: components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";

export default function Header() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems, openCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((data) => {
      if (data) setSiteInfo(data);
    });

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const storeName = siteInfo?.siteName || siteInfo?.site_name || "Axon | آکسون";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 sm:px-6 transition-all duration-300 pointer-events-none pt-3 sm:pt-4"
        dir="rtl"
      >
        <div
          className={`pointer-events-auto flex items-center justify-between w-full max-w-7xl px-4 sm:px-6 py-2.5 rounded-full border transition-all duration-300 font-sans select-none ${
            isScrolled
              ? "bg-[var(--modal-bg)]/90 backdrop-blur-2xl border-[var(--card-border)] shadow-2xl shadow-black/20 scale-[0.98] py-2"
              : "bg-[var(--modal-bg)]/80 backdrop-blur-xl border-[var(--card-border)]/70 shadow-lg py-2.5"
          }`}
        >
          {/* بخش راست: نشان و عنوان برند */}
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] p-1.5 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-lg text-[var(--accent-blue)] font-black">⚡</span>
              )}
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)] block tracking-tight">
                {storeName}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold block">
                مرجع مانیتورهای ۵K استودیو
              </span>
            </div>
          </Link>

          {/* بخش وسط: پیوندهای ناوبری دسکتاپ */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-bold text-[var(--text-secondary)]">
            <Link
              href="/products"
              onClick={() => soundEngine.playClick()}
              className="hover:text-[var(--accent-blue)] transition-colors py-1"
            >
              کاتالوگ کالاها
            </Link>
            <Link
              href="/news"
              onClick={() => soundEngine.playClick()}
              className="hover:text-[var(--accent-blue)] transition-colors py-1"
            >
              رادار اخبار
            </Link>
            <Link
              href="/blog"
              onClick={() => soundEngine.playClick()}
              className="hover:text-[var(--accent-blue)] transition-colors py-1"
            >
              مجله سئو
            </Link>
            <Link
              href="/track"
              onClick={() => soundEngine.playClick()}
              className="hover:text-[var(--accent-blue)] transition-colors py-1"
            >
              پیگیری سفارش
            </Link>
            <Link
              href="/about"
              onClick={() => soundEngine.playClick()}
              className="hover:text-[var(--accent-blue)] transition-colors py-1"
            >
              درباره ما
            </Link>
            <Link
              href="/contact"
              onClick={() => soundEngine.playClick()}
              className="hover:text-[var(--accent-blue)] transition-colors py-1"
            >
              تماس با ما
            </Link>
          </nav>

          {/* بخش چپ: میانبر سرچ، دکمه حساب کاربری و کپسول سبد خرید */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* دکمه جستجو */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
                );
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs text-[var(--text-secondary)] font-medium transition cursor-pointer"
            >
              <span>🔍</span>
              <span className="text-[11px]">جستجو در کالاها...</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]">
                ⌘K
              </span>
            </button>

            {/* دکمه ورود / حساب کاربری */}
            <Link
              href="/login"
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition shadow-sm cursor-pointer"
            >
              <span>👤</span>
              <span className="text-[11px] sm:text-xs">حساب کاربری</span>
            </Link>

            {/* بج کپسولی سبد خرید */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                openCart();
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              <span>🛍️</span>
              <span className="font-mono text-xs" suppressHydrationWarning>
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* کامپوننت جستجوی سراسری کنترل‌شونده با کلیدهای ترکیبی */}
      <AdminGlobalSearch />
    </>
  );
}
