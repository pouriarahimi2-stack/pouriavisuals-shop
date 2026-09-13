// File Path: components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, openCart } = useCart();

  const totalQuantity = (cartItems || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  const [siteName, setSiteName] = useState("آکسون | Axon");
  const [logoUrl, setLogoUrl] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.site_name) setSiteName(info.site_name);
      if (info?.logo_url || info?.logoUrl) setLogoUrl(info.logo_url || info.logoUrl || "");
    });

    const handleSiteUpdate = (e: any) => {
      if (e.detail?.site_name) setSiteName(e.detail.site_name);
      if (e.detail?.logo_url || e.detail?.logoUrl) setLogoUrl(e.detail.logo_url || e.detail.logoUrl);
    };
    window.addEventListener("site_info_updated", handleSiteUpdate);

    // وب‌سوکت بلادرنگ تنظیمات سایت
    const ch = supabase
      .channel("header-site-info-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, (payload: any) => {
        if (payload.new?.site_name) setSiteName(payload.new.site_name);
        if (payload.new?.logo_url) setLogoUrl(payload.new.logo_url);
      })
      .subscribe();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("site_info_updated", handleSiteUpdate);
      window.removeEventListener("keydown", handleKeyDown);
      supabase.removeChannel(ch);
    };
  }, []);

  // بستن منوی موبایل هنگام تغییر مسیر
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    soundEngine.playClick();
    setSearchOpen(false);
    router.push("/products?search=" + encodeURIComponent(searchQuery.trim()));
  };

  const navLinks = [
    { title: "کاتالوگ کالاها", href: "/products", icon: "🛍️" },
    { title: "رادار اخبار", href: "/news", icon: "📡" },
    { title: "مجله سئو", href: "/blog", icon: "📚" },
    { title: "پیگیری سفارش", href: "/track-order", icon: "🔍" },
    { title: "درباره ما", href: "/about", icon: "🏢" },
    { title: "تماس با ما", href: "/contact", icon: "📞" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[var(--modal-bg)]/85 border-b border-[var(--card-border)] transition-colors duration-300 font-sans select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* دکمه همبرگر موبایل و لوگو */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-base cursor-pointer hover:border-[var(--accent-blue)] transition"
            aria-label="منوی ناوبری موبایل"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <Link href="/" onClick={() => soundEngine.playClick()} className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-full h-full object-contain p-1" />
              ) : (
                <span>⚡</span>
              )}
            </div>
            <div>
              <span className="font-black text-sm sm:text-base tracking-tight text-[var(--text-primary)] block">{siteName}</span>
              <span className="text-[10px] text-[var(--text-secondary)] block font-medium">مرجع مانیتورهای ۵K استودیو</span>
            </div>
          </Link>
        </div>

        {/* منوی ناوبری دسکتاپ */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[var(--text-secondary)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => soundEngine.playClick()}
                className={`transition hover:text-[var(--accent-blue)] ${
                  isActive ? "text-[var(--accent-blue)] font-black" : ""
                }`}
              >
                {link.title}
              </Link>
            );
          })}
        </nav>

        {/* ابزارهای سرچ، اکانت و سبد خرید */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSearchOpen(true);
            }}
            className="p-2.5 sm:px-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            title="جستجوی سریع (Ctrl + K)"
          >
            <span>🔍</span>
            <span className="hidden lg:inline text-[11px] text-[var(--text-secondary)]">جستجو در کالاها...</span>
            <kbd className="hidden xl:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-slate-400">⌘K</kbd>
          </button>

          <Link
            href="/login"
            onClick={() => soundEngine.playClick()}
            className="p-2.5 sm:px-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>👤</span>
            <span className="hidden sm:inline">حساب کاربری</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              openCart?.();
            }}
            className="p-2.5 sm:px-4 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black transition shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-95"
            aria-label="باز کردن سبد خرید"
          >
            <span>🛍️</span>
            <span className="font-mono">{totalQuantity}</span>
          </button>
        </div>
      </div>

      {/* منوی کشویی تمام‌صفحه موبایل */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--card-border)] bg-[var(--modal-bg)] p-5 space-y-4 shadow-2xl animate-fadeIn">
          <nav className="grid grid-cols-2 gap-2 text-xs font-bold">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  soundEngine.playClick();
                  setMobileMenuOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-2 hover:border-[var(--accent-blue)] transition"
              >
                <span>{link.icon}</span>
                <span>{link.title}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>📞 پشتیبانی: ۰۹۳۷۶۱۱۰۲۰۰</span>
            <Link href="/track-order" className="text-[var(--accent-blue)] font-black hover:underline">
              رهگیری مرسوله ←
            </Link>
          </div>
        </div>
      )}

      {/* مدال جستجوی سراسری هوشمند */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="text-xl">🔍</span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مانیتور ۵K، کابل تاندربولت، تجهیزات تدوین..."
                className="w-full bg-transparent border-none outline-none font-bold text-xs sm:text-sm text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[var(--input-bg)] hover:bg-rose-500 hover:text-white transition"
              >
                ESC
              </button>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[var(--text-secondary)]">
              <span>کلید Enter را برای استعلام بزنید</span>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-md">
                جستجو در کاتالوگ 🚀
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
