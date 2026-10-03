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
  const pathname = usePathname() || "/";
  const { openCart, totalItems } = useCart();
  const { siteInfo, refresh } = useSiteInfo();

  const layoutCfg = siteInfo?.homepage_layout_config || {};
  const headerCfg = layoutCfg?.header || DEFAULT_HEADER_CONFIG;
  const themeHeader =
    siteInfo?.theme_builder_config?.globalHeader ||
    layoutCfg?.theme_builder_config?.globalHeader ||
    {};
  const annCfg = headerCfg?.announcement || {};

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [annDismissed, setAnnDismissed] = useState(false);

  const logoSrc = String(
    themeHeader.logoUrl ?? headerCfg?.brand?.logoUrl ?? siteInfo?.logo_url ?? ""
  ).trim();

  const announcementEnabled = Boolean(
    themeHeader.announcementEnabled !== undefined
      ? themeHeader.announcementEnabled
      : annCfg.show
  );
  const announcementText = String(
    themeHeader.announcementText ?? annCfg.text ?? siteInfo?.header_announcement ?? ""
  ).trim();

  useEffect(() => {
    setLogoError(false);
  }, [logoSrc]);

  useEffect(() => {
    setAnnDismissed(false);
  }, [announcementText, announcementEnabled]);

  const syncUserSession = () => {
    try {
      let resolvedName = "";
      const draftRaw = localStorage.getItem("axon_checkout_form_draft_v2026");
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft?.fullName && String(draft.fullName).trim().length > 1) {
          resolvedName = String(draft.fullName).trim();
        }
      }

      const local = localStorage.getItem("axon_user_session");
      if (local) {
        const parsed = JSON.parse(local);
        const rawName = parsed?.full_name || parsed?.name || parsed?.username || "";
        if (rawName && !/^0?9\d{9}$/.test(String(rawName).trim())) {
          setUserLabel(String(rawName).trim());
        } else if (resolvedName) {
          setUserLabel(resolvedName);
        } else if (parsed?.phone) {
          setUserLabel(String(parsed.phone).trim());
        } else {
          setUserLabel("پنل کاربری");
        }
      } else {
        setUserLabel(null);
      }
    } catch {
      setUserLabel(null);
    }
  };

  useEffect(() => {
    themeEngine.initThemeListener();
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
    syncUserSession();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const onThemeChanged = (e: any) => {
      if (e?.detail) setIsDarkMode(e.detail === "dark");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("user_auth_changed", syncUserSession);
    window.addEventListener("theme_changed", onThemeChanged);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user_auth_changed", syncUserSession);
      window.removeEventListener("theme_changed", onThemeChanged);
    };
  }, [refresh]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    soundEngine.playClick();
    const next = !isDarkMode;
    setIsDarkMode(next);
    themeEngine.applyTheme(next ? "dark" : "light", true);
  };

  if (headerCfg.show === false) return null;

  const variantMode = themeHeader.variant || headerCfg.variant || "capsule";
  const isCapsule = variantMode !== "full-width";
  const brandName =
    themeHeader.brandName ||
    headerCfg?.brand?.name ||
    siteInfo?.site_name ||
    "آکسون کور | Axon Core";

  const logoWidth = Number(themeHeader.logoWidth || headerCfg?.brand?.logoWidth || 38);
  const logoHeight = Number(themeHeader.logoHeight || headerCfg?.brand?.logoHeight || 38);
  const logoRadius = themeHeader.logoRadius || "12px";
  const logoFit = themeHeader.logoObjectFit || "contain";
  const baseHeight = Number(themeHeader.height || headerCfg.height || 60);

  const navMenuFromDb = siteInfo?.navigation_menu || layoutCfg?.navigation_menu;
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

  const isPhoneLabel = Boolean(userLabel && /^0?9\d{9}$/.test(userLabel));
  const showAnnouncement = announcementEnabled && announcementText.length > 0 && !annDismissed;

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-40 flex flex-col items-center pointer-events-none" dir="rtl">
        {/* نوار اعلان بالای سایت (مستقیماً بالای هدر بدون هیچ همپوشانی) */}
        {showAnnouncement && (
          <div
            style={{
              backgroundColor: annCfg.backgroundColor || "#0284c7",
              color: annCfg.textColor || "#ffffff",
            }}
            className="w-full px-4 py-1.5 text-[11px] sm:text-xs font-black text-center flex items-center justify-center gap-3 shadow-md pointer-events-auto font-sans select-text"
          >
            <span className="truncate max-w-4xl">{announcementText}</span>
            <button
              type="button"
              onClick={() => setAnnDismissed(true)}
              className="w-5 h-5 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-[10px] cursor-pointer shrink-0 transition"
              aria-label="بستن اعلان"
            >
              ✕
            </button>
          </div>
        )}

        {/* هدر اصلی سایت */}
        <header
          data-axon-header="main"
          className="w-full px-3 sm:px-6 pt-2.5 pointer-events-auto transition-all duration-300"
        >
          <div
            style={{
              maxWidth: (headerCfg.maxWidth || 1280) + "px",
              height:
                isScrolled && headerCfg.shrinkOnScroll
                  ? Math.max(48, baseHeight - 6) + "px"
                  : baseHeight + "px",
            }}
            className={
              "mx-auto w-full px-4 sm:px-8 transition-all duration-300 flex items-center justify-between gap-4 border shadow-xl backdrop-blur-2xl " +
              (isCapsule ? "rounded-full" : "rounded-2xl") +
              " bg-[var(--modal-bg)]/95 border-[var(--card-border)]"
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
                      borderRadius: String(logoRadius),
                      objectFit: logoFit as any,
                    }}
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
                title="تغییر تم روز و شب"
              >
                {isDarkMode ? "🌙" : "☀️"}
              </button>

              <Link
                href={userLabel ? "/account" : "/login"}
                onClick={() => soundEngine.playClick()}
                className="hidden sm:flex px-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition items-center gap-1.5 max-w-[220px]"
              >
                <span>👤</span>
                {userLabel ? (
                  isPhoneLabel ? (
                    <span className="font-mono font-bold tracking-tight" dir="ltr">
                      {userLabel}
                    </span>
                  ) : (
                    <span className="truncate">سلام، {userLabel}</span>
                  )
                ) : (
                  <span>حساب کاربری</span>
                )}
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
      </div>

      {/* اسپیسر خودکار در صورت فعال بودن نوار اعلان تا محتوای صفحه زیر هدر نرود */}
      {showAnnouncement && <div className="h-7 w-full" />}

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[88px] z-30 px-3" dir="rtl">
          <div className="rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl p-4 space-y-1 max-h-[75vh] overflow-y-auto">
            <Link
              href={userLabel ? "/account" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-xs font-black text-[var(--accent-blue)] mb-3"
            >
              <span className="text-base">👤</span>
              <span>
                {userLabel ? "پنل کاربری (" + userLabel + ")" : "ورود / ثبت‌نام سریع"}
              </span>
            </Link>

            {menuItems.map((item: any) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={() => soundEngine.playClick()}
                className={
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition " +
                  (pathname === item.url
                    ? "bg-[var(--accent-blue)] text-white"
                    : "hover:bg-[var(--input-bg)] text-[var(--text-primary)]")
                }
              >
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
