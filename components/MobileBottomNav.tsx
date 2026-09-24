"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart() as any;
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : (Array.isArray(cart?.items) ? cart.items : []);

  const cartCount = cartItems.reduce(
    (acc: number, item: any) => acc + (Number(item?.quantity) || 1),
    0
  );

  useEffect(() => {
    try {
      const user = localStorage.getItem("axon_user_session");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.phone) setUserPhone(String(parsed.phone));
        else if (parsed.name) setUserPhone(parsed.name);
      }
    } catch {}

    const handleAuthChange = (e: any) => {
      if (e.detail?.phone) setUserPhone(String(e.detail.phone));
      else if (e.detail?.name) setUserPhone(String(e.detail.name));
      else setUserPhone(null);
    };
    window.addEventListener("user_auth_changed", handleAuthChange);
    return () => window.removeEventListener("user_auth_changed", handleAuthChange);
  }, []);

  const navItems = [
    { label: "خانه",      href: "/",            icon: "🏠" },
    { label: "کالاها",    href: "/products",     icon: "📦" },
    { label: "سبد خرید",  href: "#cart",         isCart: true, icon: "🛒", badge: cartCount },
    { label: "پیگیری",   href: "/track-order",  icon: "🚚" },
    { label: userPhone ? "حساب من" : "ورود",
      href: userPhone ? "/my-orders" : "/login", icon: "👤" },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-[var(--modal-bg)]/97 backdrop-blur-xl border-t border-[var(--card-border)] font-sans select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="h-16 px-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = !item.isCart && pathname === item.href;

          if (item.isCart) {
            return (
              <button
                key={item.label}
                onClick={() => {
                  soundEngine.playClick();
                  if (typeof cart?.openCart === "function") cart.openCart();
                }}
                className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition min-w-[48px] py-1"
              >
                <span className="text-lg relative">
                  {item.icon}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[var(--accent-blue)] text-white text-[9px] font-mono flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => soundEngine.playClick()}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition min-w-[48px] py-1 ${
                isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <span className={`text-lg ${isActive ? "scale-110" : ""} transition-transform`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
