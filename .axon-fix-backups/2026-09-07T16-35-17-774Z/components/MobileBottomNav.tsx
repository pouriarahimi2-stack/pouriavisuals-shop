// File Path: components/MobileBottomNav.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

interface NavItem {
  id: string;
  label: string;
  href?: string;
  isAction?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, toggleCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "خانه",
      href: "/",
      icon: (active) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "products",
      label: "کاتالوگ",
      href: "/#products",
      icon: (active) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: "cart",
      label: "سبد خرید",
      isAction: true,
      icon: (active) => (
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {mounted && totalItems > 0 && (
            <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
              {totalItems}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "track",
      label: "پیگیری",
      href: "/track-order",
      icon: (active) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const getActiveIndex = () => {
    if (pathname === "/") return 0;
    if (pathname?.startsWith("/products")) return 1;
    if (pathname === "/track-order") return 3;
    return 0;
  };

  const activeIndex = getActiveIndex();

  const handleTabClick = (item: NavItem) => {
    soundEngine.playClick();
    if (item.isAction) {
      toggleCart();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] z-50 select-none font-sans"
      dir="rtl"
    >
      <div className="w-full h-[62px] rounded-full shadow-2xl border border-[var(--card-border)] backdrop-blur-3xl bg-[var(--modal-bg)]/90 flex items-center justify-around px-3">
        {navItems.map((item, idx) => {
          const isActive = activeIndex === idx;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`flex-1 h-full flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isActive
                  ? "text-[var(--accent-blue)] scale-105 font-black"
                  : "text-[var(--text-secondary)] opacity-75 hover:opacity-100 font-bold"
              }`}
            >
              {item.icon(isActive)}
              <span className="text-[10px] mt-1 tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}