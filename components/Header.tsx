// File Path: components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";
import { DEFAULT_HEADER_CONFIG } from "@/services/siteInfoService";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function Header() {
  const pathname = usePathname();
  const { openCart, totalItems } = useCart();
  const { siteInfo, refresh } = useSiteInfo();

  const headerCfg = siteInfo?.homepage_layout_config?.header || DEFAULT_HEADER_CONFIG;
  const themeHeader = siteInfo?.homepage_layout_config?.theme_builder_config?.globalHeader || {};

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const logoSrc =
    themeHeader.logoUrl ||
    headerCfg?.brand?.logoUrl ||
    siteInfo?.logo_url ||
    "";

  useEffect(() => {
    setLogoError(false);
  }, [logoSrc]);

  const syncUserSession = () => {
    try {
      const local = localStorage.getItem("axon_user_session");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.name) setUserName(parsed.name);
        else if (parsed?.username) setUserName(parsed.username);
        else if (parsed?.phone) setUserName(parsed.phone);
      } else {
        setUserName(null);
      }
    } catch {}
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
    syncUserSession();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleConfigChange = () => {
      if (typeof refresh === "function") refresh();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("user_auth_changed", syncUserSession);
    window.addEventListener("theme_builder_updated", handleConfigChange);
    window.addEventListener("menus_updated", handleConfigChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user_auth_changed", syncUserSession);
      window.removeEventListener("theme_builder_updated", handleConfigChange);
      window.removeEventListener("menus_updated", handleConfigChange);
    };
  }, [refresh]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    soundEngine.playClick();
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (themeEngine && typeof (themeEngine as any).applyTheme === "function") {
      (themeEngine as any).applyTheme(next ? "dark" : "light", true);
    }
  };

  if (headerCfg.show === false) return null;

  const isCapsule = headerCfg.variant !== "full-width";
  const positionClass =
    headerCfg.position === "fixed"
      ? "fixed top-3 inset-x-0 z-40"
      : headerCfg.position === "sticky"
      ? "sticky top-3 z-40"
      : "relative z-40";

  const brandName =
    themeHeader.brandName ||
    headerCfg?.brand?.name ||
    siteInfo?.site_name ||
    "آکسون کور | Axon Core";

  const logoWidth = Number(themeHeader.logoWidth || headerCfg?.brand?.logoWidth || 38);
  const logoHeight = Number(themeHeader.logoHeight || headerCfg?.brand?.logoHeight || 38);

  const navMenuFromDb = siteInfo?.homepage_layout_config?.navigation_menu;
  const menuItems =
    Array.isArray(navMenuFromDb) && navMenuFromDb.length > 0
      ? navMenuFromDb
          .filter((m: any) => m.is_active !== false)
          .map((m: any) => ({
            id: m.id,
            title: m.title,
            url: m.url || "/products",
            children: Array.isArray(m.children) ? m.children : [],
          }))
      : (headerCfg?.menu?.items || DEFAULT_HEADER_CONFIG.menu.items).filter(
          (m: any) => m.show !== false
        );

  return (
    <>
      <header
        data-axon-header="main"
        className={"w-full transition-all duration-300 " + positionClass + " px-3 sm:px-6"}
        dir="rtl"
      >
        <div
          style={{
            maxWidth: (headerCfg.maxWidth || 1280) + "px",
            height:
              isScrolled && headerCfg.shrinkOnScroll
                ? Math.max(48, (headerCfg.height || 60) - 8) + "px"
                : (headerCfg.height || 60) + "px",
          }}
          className={
            "mx-auto w-full px-4 sm:px-8 transition-all duration-300 flex items-center justify-between gap-4 border shadow-xl backdrop-blur-2xl " +
            (isCapsule ? "rounded-full" : "rounded-2xl") +
            " bg-[var(--modal-bg)]/90 border-[var(--card-border)]"
          }
        >
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-2.5 text-sm sm:text-base font-black tracking-tight text-[var(--text-primary)] hover:opacity-90 transition shrink-0"
            >
              {logoSrc && !logoError ? (
                <img
                  src={logoSrc}
                  alt={brandName}
                  onError={() => setLogoError(true)}
                  style={{
                    width: logoWidth + "px",
                    height: logoHeight + "px",
                  }}
                  className="object-contain rounded-lg"
                />
              ) : (
                <AnimatedLogo size={36} />
              )}
              <span className="font-black whitespace-nowrap hidden sm:inline">{brandName}</span>
            </Link>

            {headerCfg.menu?.show !== false && (
              <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-bold text-[var(--text-secondary)]">
                {menuItems.map((item: any) => {
                  const isActive = pathname === item.url;
                  const hasSub = Array.isArray(item.children) && item.children.length > 0;
                  return (
                    <div key={item.id} className="relative group py-2">
                      <Link
                        href={item.url}
                        className={
                          "hover:text-[var(--text-primary)] transition whitespace-nowrap flex items-center gap-1 " +
                          (isActive ? "text-[var(--accent-blue)] font-black" : "")
                        }
                      >
                        <span>{item.title}</span>
                        {hasSub && <span className="text-[9px] opacity-70">▼</span>}
                      </Link>

                      {hasSub && (
                        <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50 min-w-[210px]">
                          <div className="p-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-1">
                            {item.children.map((sub2: any) => (
                              <div key={sub2.id} className="space-y-1">
                                <Link
                                  href={sub2.url || "/products"}
                                  className="block px-3 py-2 rounded-xl hover:bg-[var(--input-bg)] text-[var(--text-primary)] font-bold text-xs transition"
                                >
                                  {sub2.title}
                                </Link>
                                {Array.isArray(sub2.children) && sub2.children.length > 0 && (
                                  <div className="pr-3 border-r border-[var(--card-border)] space-y-0.5">
                                    {sub2.children.map((sub3: any) => (
                                      <Link
                                        key={sub3.id}
                                        href={sub3.url || "/products"}
                                        className="block px-2.5 py-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] text-[11px] transition"
                                      >
                                        ↳ {sub3.title}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-xs transition cursor-pointer"
              title="تغییر تم"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>

            <Link
              href={userName ? "/account" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="hidden sm:flex px-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition items-center gap-1.5 max-w-[160px] truncate"
            >
              <span>👤</span>
              <span className="truncate">{userName ? "سلام، " + userName : "حساب کاربری"}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                openCart();
              }}
              className="px-4 sm:px-5 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>🛒</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[11px]">
                {totalItems}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm font-bold transition cursor-pointer hover:border-[var(--accent-blue)]"
              aria-label="منوی ناوبری"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[76px] z-30 px-3" dir="rtl">
          <div className="rounded-3xl bg-[var(--modal-bg)]/98 backdrop-blur-2xl border border-[var(--card-border)] shadow-2xl p-4 space-y-1 max-h-[75vh] overflow-y-auto">
            <Link
              href={userName ? "/account" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-xs font-black text-[var(--accent-blue)] mb-3"
            >
              <span className="text-base">👤</span>
              <span>{userName ? "پنل کاربری (" + userName + ")" : "ورود / ثبت‌نام سریع"}</span>
            </Link>

            {menuItems.map((item: any) => {
              const isActive = pathname === item.url;
              return (
                <div key={item.id} className="space-y-1">
                  <Link
                    href={item.url}
                    onClick={() => soundEngine.playClick()}
                    className={
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition " +
                      (isActive
                        ? "bg-[var(--accent-blue)] text-white"
                        : "hover:bg-[var(--input-bg)] text-[var(--text-primary)]")
                    }
                  >
                    <span>{item.title}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
