// File Path: components/Header.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { siteInfoService, SiteInfo, DEFAULT_SITE_INFO } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Header() {
  const router = useRouter();
  const { totalItems, toggleCart } = useCart();

  const [mounted, setMounted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [userSession, setUserSession] = useState<{ phone: string } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const checkUserAuth = () => {
    try {
      const saved = localStorage.getItem("axon_user_session");
      if (saved) setUserSession(JSON.parse(saved));
      else setUserSession(null);
    } catch {
      setUserSession(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUserAuth();

    setIsDarkMode(document.documentElement.classList.contains("dark"));

    siteInfoService.getSiteInfo().then((info) => {
      if (info) setSiteInfo(info);
    });

    const handleSiteInfoUpdate = (e: any) => { if (e.detail) setSiteInfo(e.detail); };
    const handleUserAuthChanged = () => checkUserAuth();
    const handleThemeChanged = (e: any) => setIsDarkMode(e.detail === "dark");

    window.addEventListener("site_info_updated", handleSiteInfoUpdate);
    window.addEventListener("user_auth_changed", handleUserAuthChanged);
    window.addEventListener("theme_changed", handleThemeChanged);

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteInfoUpdate);
      window.removeEventListener("user_auth_changed", handleUserAuthChanged);
      window.removeEventListener("theme_changed", handleThemeChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    themeEngine.applyTheme(nextDark ? "dark" : "light", true);
  };

  const handleUserLogout = () => {
    soundEngine.playClick();
    localStorage.removeItem("axon_user_session");
    setUserSession(null);
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { title: "کاتالوگ محصولات", href: "/#products" },
    { title: "اخبار تکنولوژی", href: "/news" },
    { title: "مجله سئو", href: "/blog" },
    { title: "پیگیری سفارش", href: "/track-order" },
    { title: "تماس با ما", href: "/contact" },
  ];

  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <header className="sticky top-3 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 transition-all duration-300" dir="rtl" suppressHydrationWarning>
      <div className="w-full glass-morphism rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-xl">
        
        {/* برند و لوگوی بزرگ در سمت راست */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <AnimatedLogo customLogoUrl={logoUrl} size={50} />
            <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-blue)] transition">
              {storeName}
            </div>
          </Link>
        </div>

        {/* لینک‌های ناوبری اصلی */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold opacity-90">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:text-[var(--accent-blue)] transition">
              {link.title}
            </Link>
          ))}
        </nav>

        {/* دکمه‌های کنترل حساب، تم و سبد خرید */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                soundEngine.playClick();
                if (userSession) {
                  setIsUserMenuOpen(!isUserMenuOpen);
                } else {
                  router.push("/login");
                }
              }}
              className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] relative active:scale-95"
              title={userSession ? `حساب: ${userSession.phone}` : "ورود به حساب کاربری"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {userSession && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1 right-1 border-2 border-[var(--modal-bg)] shadow-md" />
              )}
            </button>

            {isUserMenuOpen && userSession && (
              <div className="absolute top-12 left-0 w-52 p-3 rounded-2xl glass-morphism shadow-2xl z-50 animate-fadeIn space-y-2.5 bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs text-right">
                <div className="border-b border-[var(--card-border)] pb-2">
                  <span className="text-[10px] text-[var(--text-secondary)] block">حساب متصل:</span>
                  <span className="font-mono font-black text-[var(--text-primary)] text-xs" dir="ltr">
                    {userSession.phone}
                  </span>
                </div>

                <Link
                  href="/track-order"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--input-bg)] font-bold transition text-[var(--text-primary)]"
                >
                  <span>📦</span>
                  <span>پیگیری سفارشات من</span>
                </Link>

                <button
                  onClick={handleUserLogout}
                  className="w-full text-right flex items-center gap-2 p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 font-bold transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span>خروج از حساب</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] active:scale-95"
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
            suppressHydrationWarning
          >
            {mounted ? (
              isDarkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => { soundEngine.playClick(); toggleCart(); }}
            className="w-10 h-10 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-[var(--text-primary)] relative active:scale-95"
            title="سبد خرید"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-blue)] rounded-full text-[10px] font-mono font-black flex items-center justify-center text-white shadow-lg animate-pulse">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
