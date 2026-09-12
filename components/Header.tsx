"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const cartCtx = useCart();
  
  // خواندن امن تعداد اقلام از کانتکست یا محاسبه مستقیم از cartItems
  const itemCount = (cartCtx as any).cartCount ?? (cartCtx as any).totalCount ?? (cartCtx.cartItems || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
  const openCart = cartCtx.openCart;

  const [siteName, setSiteName] = useState("آکسون | Axon");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info?.site_name) setSiteName(info.site_name);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    soundEngine.playClick();
    setSearchOpen(false);
    router.push("/products?search=" + encodeURIComponent(searchQuery.trim()));
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[var(--modal-bg)]/80 border-b border-[var(--card-border)] transition-colors duration-300 font-sans select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* لوگو و نام برند */}
        <Link href="/" onClick={() => soundEngine.playClick()} className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
            ⚡
          </div>
          <div>
            <span className="font-black text-sm sm:text-base tracking-tight text-[var(--text-primary)] block">{siteName}</span>
            <span className="text-[10px] text-[var(--text-secondary)] block font-medium">مرجع مانیتورهای ۵K استودیو</span>
          </div>
        </Link>

        {/* منوی ناوبری دسکتاپ */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[var(--text-secondary)]">
          <Link href="/products" className="hover:text-[var(--accent-blue)] transition">کاتالوگ محصولات</Link>
          <Link href="/news" className="hover:text-[var(--accent-blue)] transition">رادار اخبار</Link>
          <Link href="/blog" className="hover:text-[var(--accent-blue)] transition">مجله تخصصی سئو</Link>
          <Link href="/track-order" className="hover:text-[var(--accent-blue)] transition">پیگیری سفارش</Link>
          <Link href="/about" className="hover:text-[var(--accent-blue)] transition">درباره ما</Link>
          <Link href="/contact" className="hover:text-[var(--accent-blue)] transition">تماس با ما</Link>
        </nav>

        {/* بخش جستجو، اکانت و سبد خرید */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setSearchOpen(true); }}
            className="p-2.5 px-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            title="جستجوی سریع در کاتالوگ (Ctrl + K)"
          >
            <span>🔍</span>
            <span className="hidden sm:inline text-[11px] text-[var(--text-secondary)]">جستجو...</span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">⌘K</kbd>
          </button>

          <Link
            href="/login"
            onClick={() => soundEngine.playClick()}
            className="p-2.5 px-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>👤</span>
            <span className="hidden sm:inline">ورود</span>
          </Link>

          <button
            type="button"
            onClick={() => { soundEngine.playClick(); openCart?.(); }}
            className="p-2.5 px-3.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black transition shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer hover:opacity-90"
          >
            <span>🛍️</span>
            <span className="font-mono">{itemCount}</span>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl p-4 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="text-xl">🔍</span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مانیتور ۵K، کابل تاندربولت، تجهیزات..."
                className="w-full bg-transparent border-none outline-none font-bold text-xs sm:text-sm text-[var(--text-primary)]"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-xs font-bold px-2 py-1 rounded-xl bg-[var(--input-bg)]">
                ESC
              </button>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[var(--text-secondary)]">
              <span>اینتر را برای مشاهده نتایج بزنید</span>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-bold">
                جستجو در کاتالوگ
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
