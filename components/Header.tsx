"use client";

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
    menu1Text?: string;
    menu1Url?: string;
    menu2Text?: string;
    menu2Url?: string;
    menu3Text?: string;
    menu3Url?: string;
    menu4Text?: string;
    menu4Url?: string;
    menu5Text?: string;
    menu5Url?: string;
    showCart?: boolean;
    showTheme?: boolean;
    showUser?: boolean;
    capsuleBg?: string;
    capsuleBorder?: string;
  }>({});

  const loadHeaderState = async () => {
    try {
      // بررسی لوکال سراسری
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("axon_global_header_footer_v2026");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.header?.props) {
            setHeaderConfig(parsed.header.props);
          }
        }
      }

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

  const storeName = headerConfig.brandText || siteInfo?.site_name || siteInfo?.siteName || siteInfo?.storeName || "Axon | آکسون";
  const logoUrl = headerConfig.logoUrl || siteInfo?.logo_url || siteInfo?.logoUrl;
  const logoW = Number(headerConfig.logoWidth) || 36;
  const logoH = Number(headerConfig.logoHeight) || 36;

  const showCart = headerConfig.showCart !== false;
  const showTheme = headerConfig.showTheme !== false;
  const showUser = headerConfig.showUser !== false;

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
          {showCart && (
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
          )}

          {showTheme && (
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
              title="حالت شب / روز"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>
          )}

          {showUser && (
            <Link
              href="/admin/login"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition cursor-pointer text-xs"
              title="ورود به حساب"
            >
              👤
            </Link>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-xs font-black text-slate-700 dark:text-slate-300 order-2" dir="rtl">
          {headerConfig.menu1Text !== "" && <Link href={headerConfig.menu1Url || "/products"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu1Text || "کاتالوگ محصولات"}</Link>}
          {headerConfig.menu2Text !== "" && <Link href={headerConfig.menu2Url || "/news"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu2Text || "اخبار تکنولوژی"}</Link>}
          {headerConfig.menu3Text !== "" && <Link href={headerConfig.menu3Url || "/blog"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu3Text || "مجله سئو"}</Link>}
          {headerConfig.menu4Text !== "" && <Link href={headerConfig.menu4Url || "/track-order"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu4Text || "پیگیری سفارش"}</Link>}
          {headerConfig.menu5Text !== "" && <Link href={headerConfig.menu5Url || "/contact"} className="hover:text-sky-500 transition cursor-pointer">{headerConfig.menu5Text || "تماس با ما"}</Link>}
        </nav>

        <Link href="/" className="flex items-center gap-3 group order-3" dir="rtl">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition">
            {storeName}
          </span>
          <div
            style={{ width: logoW + "px", height: logoH + "px" }}
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
