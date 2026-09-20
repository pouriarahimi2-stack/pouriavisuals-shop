"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";
import { siteInfoService, HeaderConfig, DEFAULT_HEADER_CONFIG } from "@/services/siteInfoService";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Header() {
  const pathname = usePathname();
  const cart = useCart() as any;
  const [headerCfg, setHeaderCfg] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : (Array.isArray(cart?.items) ? cart.items : []);

  const cartCount = cartItems.reduce(
    (acc: number, item: any) => acc + (Number(item?.quantity) || 1),
    0
  );

  const syncHeader = () => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.homepage_layout_config?.header) {
        setHeaderCfg(info.homepage_layout_config.header);
      }
    });
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
    syncHeader();

    try {
      const user = localStorage.getItem("axon_user_session");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.phone) setUserPhone(String(parsed.phone));
      }
    } catch {}

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("site_info_updated", syncHeader);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("site_info_updated", syncHeader);
    };
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (themeEngine && typeof (themeEngine as any).applyTheme === "function") {
      (themeEngine as any).applyTheme(next ? "dark" : "light", true);
    }
  };

  if (!headerCfg.show) return null;

  const isCapsule = headerCfg.variant === "capsule";
  const positionClass =
    headerCfg.position === "fixed"
      ? "fixed top-3 inset-x-0 z-40"
      : headerCfg.position === "sticky"
      ? "sticky top-3 z-40"
      : "relative z-40";

  const brandName = headerCfg.brand.name || "آکسون کور | Axon Core";
  const logoSrc = headerCfg.brand.logoUrl;

  return (
    <header className={`w-full transition-all duration-300 ${positionClass} px-3 sm:px-6`} dir="rtl">
      <div
        style={{
          maxWidth: `${headerCfg.maxWidth || 1280}px`,
          height: isScrolled && headerCfg.shrinkOnScroll ? `${Math.max(48, headerCfg.height - 8)}px` : `${headerCfg.height || 60}px`,
        }}
        className={`mx-auto w-full px-4 sm:px-8 transition-all duration-300 flex items-center justify-between gap-4 border shadow-xl backdrop-blur-2xl ${
          isCapsule ? "rounded-full" : "rounded-2xl"
        } bg-[var(--modal-bg)]/90 border-[var(--card-border)]`}
      >
        {/* راست: لوگو و لینک‌ها */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            onClick={() => soundEngine.playClick()}
            className="flex items-center gap-2.5 text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)] hover:opacity-90 transition shrink-0"
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={brandName}
                style={{
                  width: `${headerCfg.brand.logoWidth || 38}px`,
                  height: `${headerCfg.brand.logoHeight || 38}px`,
                }}
                className="object-contain rounded-lg"
              />
            ) : (
              <AnimatedLogo size={36} />
            )}
            {headerCfg.brand.showName && <span className="font-black whitespace-nowrap">{brandName}</span>}
          </Link>

          {headerCfg.menu.show && (
            <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-bold text-[var(--text-secondary)]">
              {headerCfg.menu.items.filter((m) => m.show !== false).map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    className={`hover:text-[var(--text-primary)] transition whitespace-nowrap flex items-center gap-1.5 ${
                      isActive ? "text-[var(--accent-blue)] font-black" : ""
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)] text-white text-[9px] font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* چپ: ابزارها و سبد خرید */}
        <div className="flex items-center gap-2.5 shrink-0">
          {headerCfg.actions.themeToggle.show && (
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-xs transition cursor-pointer"
              title="تغییر تم"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>
          )}

          {headerCfg.actions.account.show && (
            <Link
              href={userPhone ? "/my-orders" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="px-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5"
            >
              <span>👤</span>
              <span className="hidden sm:inline">{userPhone ? "سفارش‌های من" : "حساب کاربری"}</span>
            </Link>
          )}

          {headerCfg.actions.cart.show && (
            <button
              onClick={() => {
                soundEngine.playClick();
                if (typeof cart?.openCart === "function") cart.openCart();
              }}
              className="px-4 sm:px-5 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
            >
              <span>🛒</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[11px]">{cartCount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
