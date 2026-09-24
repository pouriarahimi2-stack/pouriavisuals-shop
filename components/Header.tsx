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
  // استفاده از context مشترک — بدون fetch جداگانه!
  const { siteInfo } = useSiteInfo();
  const headerCfg = siteInfo?.homepage_layout_config?.header || DEFAULT_HEADER_CONFIG;

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const syncUserSession = () => {
    try {
      const match = document.cookie.match(/(^|;)\s*axon_user_session=([^;]+)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        if (parsed?.name) setUserName(parsed.name);
        else if (parsed?.phone) setUserName(parsed.phone);
      } else {
        const local = localStorage.getItem("axon_user_session");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed?.name) setUserName(parsed.name);
          else if (parsed?.phone) setUserName(parsed.phone);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
    syncUserSession();

    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("user_auth_changed", syncUserSession);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user_auth_changed", syncUserSession);
    };
  }, []);

  // بستن منوی موبایل با تغییر صفحه
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

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
  const menuItems = headerCfg.menu.items.filter((m) => m.show !== false);

  return (
    <>
      <header data-axon-header="main" className={`w-full transition-all duration-300 ${positionClass} px-3 sm:px-6`} dir="rtl">
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
                  style={{ width: `${headerCfg.brand.logoWidth || 38}px`, height: `${headerCfg.brand.logoHeight || 38}px` }}
                  className="object-contain rounded-lg"
                />
              ) : (
                <AnimatedLogo size={36} />
              )}
              {headerCfg.brand.showName && <span className="font-black whitespace-nowrap hidden sm:inline">{brandName}</span>}
            </Link>

            {/* منوی دسکتاپ */}
            {headerCfg.menu.show && (
              <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-bold text-[var(--text-secondary)]">
                {menuItems.map((item) => {
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

          {/* چپ: اکشن‌ها */}
          <div className="flex items-center gap-2 shrink-0">
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
                href={userName ? "/my-orders" : "/login"}
                onClick={() => soundEngine.playClick()}
                className="hidden sm:flex px-4 py-2 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition items-center gap-1.5 max-w-[160px] truncate"
              >
                <span>👤</span>
                <span className="truncate">{userName ? `سلام، ${userName}` : "حساب کاربری"}</span>
              </Link>
            )}

            {headerCfg.actions.cart.show && (
              <button
                onClick={() => { soundEngine.playClick(); openCart(); }}
                className="px-4 sm:px-5 py-2 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🛒</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[11px]">{totalItems}</span>
              </button>
            )}

            {/* دکمه منوی موبایل — فقط در موبایل */}
            <button
              onClick={() => { soundEngine.playClick(); setMobileMenuOpen(!mobileMenuOpen); }}
              className="md:hidden w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm font-bold transition cursor-pointer hover:border-[var(--accent-blue)]"
              aria-label="منوی ناوبری"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* منوی موبایل Dropdown — با تمام آیتم‌ها */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-[76px] z-30 px-3"
          dir="rtl"
        >
          <div className="rounded-3xl bg-[var(--modal-bg)]/98 backdrop-blur-2xl border border-[var(--card-border)] shadow-2xl p-4 space-y-1 max-h-[75vh] overflow-y-auto">
            {/* لینک به حساب کاربری در موبایل */}
            <Link
              href={userName ? "/my-orders" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-xs font-black text-[var(--accent-blue)] mb-3"
            >
              <span className="text-base">👤</span>
              <span>{userName ? `سلام، ${userName}` : "ورود به حساب کاربری"}</span>
            </Link>

            {/* آیتم‌های منو از DB */}
            {menuItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={() => soundEngine.playClick()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? "bg-[var(--accent-blue)] text-white"
                      : "hover:bg-[var(--input-bg)] text-[var(--text-primary)]"
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

            {/* لینک‌های ثابت اضافه در موبایل */}
            <div className="pt-2 mt-2 border-t border-[var(--card-border)] grid grid-cols-2 gap-2">
              <Link
                href="/track-order"
                onClick={() => soundEngine.playClick()}
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                <span>🚚</span><span>پیگیری سفارش</span>
              </Link>
              <Link
                href="/contact"
                onClick={() => soundEngine.playClick()}
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                <span>📞</span><span>تماس با ما</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* overlay برای بستن منوی موبایل */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
