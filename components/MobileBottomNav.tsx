// File Path: components/MobileBottomNav.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cartContext = useCart();
  const { totalItems, toggleCart } = cartContext;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-[var(--modal-bg)]/90 backdrop-blur-2xl border border-[var(--card-border)] rounded-[2rem] px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-around text-[10px] font-black select-none transition-all" dir="rtl" suppressHydrationWarning>
      
      <Link
        href="/"
        onClick={() => soundEngine.playClick()}
        className={`flex flex-col items-center gap-1 transition ${pathname === "/" ? "text-[var(--accent-blue)] scale-105" : "text-[var(--text-secondary)]"}`}
      >
        <span className="text-base">🏠</span>
        <span>صفحه اصلی</span>
      </Link>

      <Link
        href="/#products"
        onClick={() => soundEngine.playClick()}
        className={`flex flex-col items-center gap-1 transition ${pathname === "/products" ? "text-[var(--accent-blue)] scale-105" : "text-[var(--text-secondary)]"}`}
      >
        <span className="text-base">📦</span>
        <span>محصولات</span>
      </Link>

      <button
        onClick={() => { soundEngine.playClick(); toggleCart(); }}
        className="relative flex flex-col items-center gap-1 text-[var(--text-secondary)] cursor-pointer"
      >
        <span className="text-base">🛒</span>
        <span>سبد خرید</span>
        {mounted && totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-[1rem] px-1 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-md animate-pulse" suppressHydrationWarning>
            {formatPrice(totalItems)}
          </span>
        )}
      </button>

      <Link
        href="/track-order"
        onClick={() => soundEngine.playClick()}
        className={`flex flex-col items-center gap-1 transition ${pathname === "/track-order" ? "text-[var(--accent-blue)] scale-105" : "text-[var(--text-secondary)]"}`}
      >
        <span className="text-base">📮</span>
        <span>رهگیری</span>
      </Link>
    </nav>
  );
}
