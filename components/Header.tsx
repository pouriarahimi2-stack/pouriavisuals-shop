"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";
import { siteInfoService } from "@/services/siteInfoService";

export default function Header() {
  const cart = useCart() as any;
  const [siteName, setSiteName] = useState<string>("آکسون کور | Axon");
  const [announcementText, setAnnouncementText] = useState<string>("⚡ ارسال سریع سفارشات با بسته‌بندی ایمن به سراسر کشور | ضمانت اصالت فیزیکی تمامی کالاها");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : (Array.isArray(cart?.items) ? cart.items : []);

  const cartCount = cartItems.reduce(
    (acc: number, item: any) => acc + (Number(item?.quantity) || 1),
    0
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }

    siteInfoService.getSiteInfo().then((info) => {
      if (info) {
        const resolvedName = String(info.storeName || info.site_name || (info as any).siteName || "").trim();
        if (resolvedName) {
          setSiteName(resolvedName);
        }
        const resolvedAnnouncement = String((info as any).announcement_text || "").trim();
        if (resolvedAnnouncement) {
          setAnnouncementText(resolvedAnnouncement);
        }
      }
    });

    try {
      const user = localStorage.getItem("axon_user_session");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.phone) setUserPhone(String(parsed.phone));
      }
    } catch {}

    const handleAuthChange = (e: any) => {
      if (e.detail?.phone) setUserPhone(String(e.detail.phone));
      else setUserPhone(null);
    };

    window.addEventListener("user_auth_changed", handleAuthChange);
    return () => window.removeEventListener("user_auth_changed", handleAuthChange);
  }, []);

  const toggleTheme = () => {
    soundEngine.playClick();
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (themeEngine && typeof (themeEngine as any).applyTheme === "function") {
      (themeEngine as any).applyTheme(next ? "dark" : "light", true);
    }
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--card-border)] transition-colors duration-300">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-[11px] font-bold py-1.5 px-4 text-center select-none overflow-hidden truncate">
          <span>{announcementText}</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              onClick={() => soundEngine.playClick()}
              className="flex items-center gap-2 text-base sm:text-lg font-black tracking-tight text-[var(--text-primary)] hover:opacity-90 transition"
            >
              <span className="w-9 h-9 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-black text-sm shadow-md">
                A
              </span>
              <span className="font-extrabold">{siteName}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-[var(--text-secondary)]">
              <Link href="/products" className="hover:text-[var(--text-primary)] transition">
                کاتالوگ کالاها
              </Link>
              <Link href="/news" className="hover:text-[var(--text-primary)] transition">
                رادار اخبار
              </Link>
              <Link href="/track-order" className="hover:text-[var(--text-primary)] transition">
                پیگیری سفارش
              </Link>
              <Link href="/about" className="hover:text-[var(--text-primary)] transition">
                درباره ما
              </Link>
              <Link href="/contact" className="hover:text-[var(--text-primary)] transition">
                تماس با ما
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center text-xs transition cursor-pointer"
              title="تغییر تم"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>

            <Link
              href={userPhone ? "/my-orders" : "/login"}
              onClick={() => soundEngine.playClick()}
              className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5"
            >
              <span>👤</span>
              <span className="hidden sm:inline">{userPhone ? "سفارش‌های من" : "حساب کاربری"}</span>
            </Link>

            <button
              onClick={() => {
                soundEngine.playClick();
                if (typeof cart?.openCart === "function") cart.openCart();
              }}
              className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-md hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
            >
              <span>🛒</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[11px]">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="h-24 sm:h-26" />
    </>
  );
}
