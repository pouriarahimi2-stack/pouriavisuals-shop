// File Path: components/MobileBottomNav.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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

  const navItems: NavItem[] = useMemo(
    () => [
      {
        id: "home",
        label: "خانه",
        href: "/",
        icon: (active) => (
          <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        id: "products",
        label: "کاتالوگ",
        href: "/#products",
        icon: (active) => (
          <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
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
          <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "1.8"} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
    [mounted, totalItems]
  );

  const activeIndex = useMemo(() => {
    if (pathname === "/") return 0;
    if (pathname?.startsWith("/products")) return 1;
    if (pathname === "/track-order") return 3;
    return 0;
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  const activeCenterPercent = (activeIndex + 0.5) * 25;

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
      className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] z-50 select-none font-sans"
      dir="rtl"
    >
      <div className="relative w-full">
        <div className="relative w-full h-[64px] rounded-[2.2rem] shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-[var(--card-border)] backdrop-blur-2xl bg-[var(--modal-bg)]/85 overflow-visible">
          
          <div
            className="absolute -top-3 w-16 h-4 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -translate-x-1/2"
            style={{ right: `calc(${activeCenterPercent}%)` }}
          >
            <svg viewBox="0 0 64 16" className="w-full h-full text-[var(--modal-bg)] fill-current drop-shadow-sm">
              <path d="M 0 0 C 16 0, 18 16, 32 16 C 46 16, 48 0, 64 0 Z" />
            </svg>
          </div>

          <div
            className="absolute -top-5 w-12 h-12 rounded-full pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -translate-x-1/2 flex items-center justify-center z-20 shadow-[0_8px_25px_rgba(2,132,199,0.55)] border-2 border-white/60 bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white animate-bounce-short"
            style={{ right: `calc(${activeCenterPercent}%)` }}
          >
            <div className="scale-110 drop-shadow-md">
              {navItems[activeIndex].icon(true)}
            </div>
          </div>

          <div className="relative z-10 w-full h-full flex items-center justify-around px-2">
            {navItems.map((item, idx) => {
              const isActive = activeIndex === idx;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item)}
                  className="flex-1 h-full flex flex-col items-center justify-center transition-all cursor-pointer relative pt-1 group"
                >
                  <div
                    className={`transition-all duration-300 flex flex-col items-center justify-center ${
                      isActive
                        ? "opacity-0 -translate-y-2 pointer-events-none"
                        : "opacity-65 group-hover:opacity-100 text-[var(--text-primary)]"
                    }`}
                  >
                    {item.icon(false)}
                    <span className="text-[10px] font-bold mt-1 tracking-tight">
                      {item.label}
                    </span>
                  </div>

                  {isActive && (
                    <span className="absolute bottom-1.5 text-[10px] font-black text-[var(--accent-blue)] tracking-tight animate-fadeIn">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
