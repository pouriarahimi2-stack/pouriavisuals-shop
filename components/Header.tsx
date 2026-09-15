"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, HeaderConfig, DEFAULT_HEADER_CONFIG } from "@/services/siteInfoService";
import { themeEngine } from "@/lib/themeEngine";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function Header() {
  const [cfg, setCfg] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { cartItems, openCart } = useCart();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const onThemeChanged = (e: any) => setIsDark(e.detail === "dark");
    window.addEventListener("theme_changed", onThemeChanged);

    siteInfoService.getSiteInfo().then((info) => {
      if (info?.homepage_layout_config?.header) {
        setCfg({ ...DEFAULT_HEADER_CONFIG, ...info.homepage_layout_config.header });
      }
    });

    const onSiteUpdate = (e: any) => {
      if (e.detail?.homepage_layout_config?.header) {
        setCfg({ ...DEFAULT_HEADER_CONFIG, ...e.detail.homepage_layout_config.header });
      }
    };
    window.addEventListener("site_info_updated", onSiteUpdate);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("theme_changed", onThemeChanged);
      window.removeEventListener("site_info_updated", onSiteUpdate);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    themeEngine.applyTheme(isDark ? "light" : "dark", true);
  };

  if (!cfg.show) return null;

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const logoSrc = cfg.brand.logoUrl || undefined;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center px-3 sm:px-6 pointer-events-none pt-2 sm:pt-3 transition-all duration-300 font-sans select-none"
      dir="rtl"
    >
      {/* نوار اعلان بالای هدر */}
      {cfg.announcement?.show && (
        <div
          style={{ backgroundColor: cfg.announcement.backgroundColor, color: cfg.announcement.textColor }}
          className="pointer-events-auto w-full max-w-7xl mb-2 px-4 py-1.5 rounded-full text-[11px] font-bold text-center shadow-md flex items-center justify-center gap-2"
        >
          <span>{cfg.announcement.text}</span>
          {cfg.announcement.link && (
            <Link href={cfg.announcement.link} className="underline mr-2">مشاهده ←</Link>
          )}
        </div>
      )}

      {/* کپسول اصلی هدر */}
      <div
        style={{
          maxWidth: `${cfg.maxWidth}px`,
          height: isScrolled && cfg.shrinkOnScroll ? `${cfg.height - 6}px` : `${cfg.height}px`,
          borderRadius: `${cfg.borderRadius}px`,
          backgroundColor: cfg.backgroundColor || undefined,
          borderColor: cfg.borderColor || undefined,
          paddingLeft: `${cfg.paddingX}px`,
          paddingRight: `${cfg.paddingX}px`,
        }}
        className={`pointer-events-auto w-full flex items-center justify-between border backdrop-blur-2xl transition-all duration-300 shadow-2xl ${
          isScrolled ? "bg-[var(--modal-bg)]/90 border-[var(--card-border)] shadow-black/20" : "bg-[var(--modal-bg)]/80 border-[var(--card-border)]/80"
        }`}
      >
        {/* برند و لوگو */}
        <Link href={cfg.brand.href || "/"} onClick={() => soundEngine.playClick()} className="flex items-center gap-3 shrink-0 group">
          {cfg.brand.showLogo && (
            <div
              style={{
                width: `${cfg.brand.logoWidth}px`,
                height: `${cfg.brand.logoHeight}px`,
                borderRadius: `${cfg.brand.logoRadius}px`,
              }}
              className="bg-[var(--input-bg)] border border-[var(--card-border)] p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
            >
              {logoSrc ? (
                <img src={logoSrc} alt={cfg.brand.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-base text-[var(--accent-blue)] font-black">⚡</span>
              )}
            </div>
          )}

          {cfg.brand.showName && (
            <div>
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)] block tracking-tight">
                {cfg.brand.name}
              </span>
              {cfg.brand.showTagline && (
                <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
                  {cfg.brand.tagline}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* منوهای ناوبری */}
        {cfg.menu.show && (
          <nav
            style={{ gap: `${cfg.menu.gap}px`, fontSize: `${cfg.menu.fontSize}px` }}
            className="hidden lg:flex items-center font-bold text-[var(--text-secondary)]"
          >
            {cfg.menu.items
              .filter((i) => i.show)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.openInNewTab ? "_blank" : undefined}
                  onClick={() => soundEngine.playClick()}
                  className="hover:text-[var(--accent-blue)] transition-colors py-1 flex items-center gap-1"
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-md bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] text-[9px] font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
          </nav>
        )}

        {/* دکمه‌های اکشن: سرچ، دکمه تم، حساب کاربری و سبد خرید */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* دکمه تم تاریک/روشن */}
          {cfg.actions.themeToggle.show && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
              title={isDark ? "حالت روشن" : "حالت تاریک"}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs transition shadow-sm cursor-pointer shrink-0"
            >
              <span suppressHydrationWarning>{isDark ? "☀️" : "🌙"}</span>
            </button>
          )}

          {/* دکمه جستجو */}
          {cfg.actions.search.show && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs text-[var(--text-secondary)] font-medium transition cursor-pointer"
            >
              <span>🔍</span>
              <span className="text-[11px]">جستجو...</span>
              <span className="text-[9px] font-mono px-1 rounded bg-[var(--modal-bg)] border border-[var(--card-border)]">⌘K</span>
            </button>
          )}

          {/* دکمه حساب کاربری */}
          {cfg.actions.account.show && (
            <Link
              href={cfg.actions.account.url || "/login"}
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition shadow-sm cursor-pointer"
            >
              <span>👤</span>
              <span className="text-[11px] sm:text-xs">{cfg.actions.account.label || "حساب کاربری"}</span>
            </Link>
          )}

          {/* دکمه سبد خرید */}
          {cfg.actions.cart.show && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                openCart();
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              <span>🛍️</span>
              {cfg.actions.cart.showCount && (
                <span className="font-mono text-xs" suppressHydrationWarning>
                  {totalCartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
