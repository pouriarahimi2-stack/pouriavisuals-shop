"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";

export default function Navbar() {
  const cart = useCart() as any;
  const [siteName, setSiteName] = useState<string>("آکسون کور | Axon");
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : (Array.isArray(cart?.items) ? cart.items : []);

  const cartCount = cartItems.reduce(
    (acc: number, item: any) => acc + (Number(item?.quantity) || 1),
    0
  );

  useEffect(() => {
    siteInfoService.getSiteInfo().then((info) => {
      if (info) {
        const resolvedName = String(info.storeName || info.site_name || (info as any).siteName || "").trim();
        if (resolvedName) {
          setSiteName(resolvedName);
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
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--card-border)] h-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-black text-sm sm:text-base text-[var(--text-primary)]">
            <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center font-bold text-xs">
              A
            </span>
            <span>{siteName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-[var(--text-secondary)]">
            <Link href="/products" className="hover:text-[var(--text-primary)] transition">محصولات</Link>
            <Link href="/news" className="hover:text-[var(--text-primary)] transition">اخبار</Link>
            <Link href="/track-order" className="hover:text-[var(--text-primary)] transition">پیگیری سفارش</Link>
            <Link href="/about" className="hover:text-[var(--text-primary)] transition">درباره ما</Link>
            <Link href="/contact" className="hover:text-[var(--text-primary)] transition">تماس با ما</Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={userPhone ? "/my-orders" : "/login"}
            className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold"
          >
            {userPhone ? "سفارش‌ها" : "ورود"}
          </Link>
          <button
            onClick={() => {
              soundEngine.playClick();
              if (typeof cart?.openCart === "function") cart.openCart();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <span>🛒</span>
            <span className="font-mono">{cartCount}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
