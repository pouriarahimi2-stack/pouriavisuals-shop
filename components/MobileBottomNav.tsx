"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCart() as any;
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const cartItems: any[] = Array.isArray(cart?.cartItems) ? cart.cartItems : Array.isArray(cart?.items) ? cart.items : [];
  const cartCount = cartItems.reduce((a: number, i: any) => a + (Number(i?.quantity) || 1), 0);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("axon_user_session") || "{}");
      if (u.phone) setUserPhone(String(u.phone));
      else if (u.name) setUserPhone(u.name);
    } catch {}
    
    const handleAuth = (e: any) => {
      if (e.detail?.phone) setUserPhone(String(e.detail.phone));
      else if (e.detail?.name) setUserPhone(e.detail.name);
      else setUserPhone(null);
    };
    window.addEventListener("user_auth_changed", handleAuth);
    return () => window.removeEventListener("user_auth_changed", handleAuth);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  // لینک‌ها اصلاح شدند تا دیگر خطای ۴۰۴ ندهند!
  const navItems = [
    { label: "خانه", href: "/", icon: Home },
    { label: "دسته‌بندی", href: "/products", icon: LayoutGrid },
    { label: "سبد خرید", href: "#cart", isCart: true, icon: ShoppingCart },
    { label: "پروفایل", href: userPhone ? "/my-orders" : "/login", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[60] md:hidden bg-white/75 dark:bg-[#0b0f17]/75 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 font-sans select-none transition-all duration-300"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      dir="rtl"
    >
      <div className="h-[65px] px-2 flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = !item.isCart && pathname === item.href;
          const Icon = item.icon;
          
          if (item.isCart) {
            return (
              <button key={item.label} onClick={() => { soundEngine.playClick(); cart?.openCart?.(); }} className="relative flex flex-col items-center justify-center gap-1 w-[25%] h-full text-[10px] font-black transition-colors duration-200 text-gray-500 dark:text-gray-400 hover:text-sky-500">
                <div className="relative">
                  <Icon size={24} strokeWidth={2} className="transition-all duration-300" />
                  {cartCount > 0 && <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono flex items-center justify-center font-bold shadow-md shadow-rose-500/30">{cartCount > 9 ? "9+" : cartCount}</span>}
                </div>
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href} onClick={() => soundEngine.playClick()} className={`flex flex-col items-center justify-center gap-1 w-[25%] h-full text-[10px] font-black transition-all duration-300 ${isActive ? "text-sky-500 dark:text-sky-400" : "text-gray-500 dark:text-gray-400"}`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-300 ${isActive ? "scale-110 drop-shadow-md text-sky-500" : ""}`} />
              <span className={isActive ? "opacity-100 text-sky-500" : "opacity-80"}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}