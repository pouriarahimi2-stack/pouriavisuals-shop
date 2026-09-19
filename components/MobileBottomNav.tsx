"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ShoppingBag, Package, User } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    try {
      const items = JSON.parse(localStorage.getItem("axon_cart") || "[]");
      const total = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      setCartCount(total);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener("cart_updated", updateCount);
    return () => window.removeEventListener("cart_updated", updateCount);
  }, []);

  const navItems = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/products", label: "محصولات", icon: Layers },
    {
      action: "cart",
      label: "سبد خرید",
      icon: ShoppingBag,
      badge: cartCount,
    },
    { href: "/track", label: "پیگیری", icon: Package },
    { href: "/admin", label: "پیشخوان", icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--modal-bg)] border-t border-[var(--card-border)] px-3 py-2 pb-safe shadow-2xl dir-rtl">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          if (item.action === "cart") {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => window.dispatchEvent(new Event("open_cart_drawer"))}
                className="flex flex-col items-center justify-center flex-1 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative transition"
              >
                <div className="relative">
                  <Icon size={20} className="text-[var(--accent-blue)]" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1 text-[var(--text-primary)]">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href || "/"}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={20} className={isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"} />
              <span className="text-[10px] font-bold mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
