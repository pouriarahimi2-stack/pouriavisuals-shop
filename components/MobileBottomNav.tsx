"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

const ICONS = {
  home:  <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  box:   <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  cart:  <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
  truck: <><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  user:  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart() as any;
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems)
    ? cart.cartItems
    : Array.isArray(cart?.items)
    ? cart.items
    : [];
  const cartCount = cartItems.reduce(
    (a: number, i: any) => a + (Number(i?.quantity) || 1),
    0
  );

  useEffect(() => {
    try {
      const u = JSON.parse(
        localStorage.getItem("axon_user_session") || "{}"
      );
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

  if (pathname?.startsWith("/admin")) return null;

  const navItems = [
    { label: "خانه",   href: "/",            icon: ICONS.home  },
    { label: "کالاها", href: "/products",    icon: ICONS.box   },
    { label: "سبد",    href: "#",            isCart: true, icon: ICONS.cart },
    { label: "پیگیری", href: "/track-order", icon: ICONS.truck },
    {
      label: userPhone ? "حساب" : "ورود",
      href: userPhone ? "/my-orders" : "/login",
      icon: ICONS.user,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 md:hidden mobile-bottom-nav"
      style={{
        paddingBottom: "env(safe-area-inset-bottom,0px)",
        background: "var(--glass-bg-strong)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderTop: "1px solid var(--glass-border)",
        boxShadow:
          "0 -4px 24px var(--accent-glow),0 -1px 0 var(--glass-border)",
      }}
    >
      <div className="h-14 px-2 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive =
            !item.isCart &&
            (pathname === item.href ||
              (item.href !== "/" &&
                (pathname ?? "").startsWith(item.href)));

          if (item.isCart) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  if (typeof cart?.openCart === "function")
                    cart.openCart();
                }}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200 cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(135deg,var(--accent-blue),var(--accent-violet))",
                    boxShadow: "0 4px 16px var(--accent-glow)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width={20}
                    height={20}
                  >
                    {item.icon}
                  </svg>
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                      style={{
                        background: "#ef4444",
                        boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                      }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-bold">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => soundEngine.playClick()}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200"
              style={{
                color: isActive
                  ? "var(--accent-blue)"
                  : "var(--text-secondary)",
              }}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive
                    ? "var(--accent-glow)"
                    : "transparent",
                  border: isActive
                    ? "1px solid var(--card-border-hover)"
                    : "1px solid transparent",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width={18}
                  height={18}
                >
                  {item.icon}
                </svg>
              </span>
              <span
                className={"text-[9px] " + (isActive ? "font-black" : "font-bold")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
