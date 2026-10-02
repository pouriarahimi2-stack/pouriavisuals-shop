"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart     = useCart() as any;
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems) ? cart.cartItems
    : Array.isArray(cart?.items) ? cart.items : [];
  const cartCount = cartItems.reduce((a: number, i: any) => a + (Number(i?.quantity) || 1), 0);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("axon_user_session") || "{}");
      if (u.phone) setUserPhone(String(u.phone));
      else if (u.name) setUserPhone(u.name);
    } catch {}
    const h = (e: any) => {
      if (e.detail?.phone) setUserPhone(String(e.detail.phone));
      else if (e.detail?.name) setUserPhone(e.detail.name);
      else setUserPhone(null);
    };
    window.addEventListener("user_auth_changed", h);
    return () => window.removeEventListener("user_auth_changed", h);
  }, []);

  // در ادمین نشون نده
  if (pathname?.startsWith("/admin")) return null;

  const navItems = [
    { label: "خانه",    href: "/",           icon: "🏠" },
    { label: "کالاها",  href: "/products",   icon: "📦" },
    { label: "سبد",     href: "#cart",        isCart: true, icon: "🛒" },
    { label: "پیگیری", href: "/track-order", icon: "🚚" },
    { label: userPhone ? "حساب" : "ورود", href: userPhone ? "/my-orders" : "/login", icon: "👤" },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-[var(--modal-bg)] border-t border-[var(--card-border)] font-sans select-text"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="h-14 px-1 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = !item.isCart && pathname === item.href;
          if (item.isCart) {
            return (
              <button key={item.label}
                onClick={() => { soundEngine.playClick(); if (typeof cart?.openCart === "function") cart.openCart(); }}
                className="relative flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition min-w-[52px] py-1">
                <span className="text-xl relative">
                  {item.icon}
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[var(--accent-blue)] text-white text-[8px] font-mono flex items-center justify-center font-bold">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </button>
            );
          }
          return (
            <Link key={item.label} href={item.href} onClick={() => soundEngine.playClick()}
              className={"flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition min-w-[52px] py-1 " + (isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]")}>
              <span className={"text-xl transition-transform " + (isActive ? "scale-110" : "")}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
