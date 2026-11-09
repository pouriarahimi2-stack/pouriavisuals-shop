"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, Package, Phone, Home, Layers, ArrowLeft } from "lucide-react";
import { menuService, MenuItem } from "@/services/menuService";

// آیکون پیش‌فرض بر اساس URL — نگه‌دارنده تجربه بصری
function resolveIcon(url: string) {
  if (url === "/" || url === "") return Home;
  if (url.includes("product") || url.includes("catalog")) return Layers;
  if (url.includes("track") || url.includes("order")) return Package;
  if (url.includes("contact") || url.includes("support")) return Phone;
  return ArrowLeft;
}

// لینک‌های fallback — اگر Supabase در دسترس نبود
const FALLBACK_LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/products", label: "کاتالوگ کالاها" },
  { href: "/track", label: "پیگیری سفارش" },
  { href: "/contact", label: "تماس و پشتیبانی" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [navLinks, setNavLinks] = useState(FALLBACK_LINKS);

  // بارگذاری داینامیک منو از Supabase
  useEffect(() => {
    menuService.getAll().then((items: MenuItem[]) => {
      const active = items.filter(
        (i) => i.is_active !== false && i.isActive !== false
      );
      if (active.length > 0) {
        setNavLinks(
          active.map((i) => ({
            href: String(i.url || i.href || "/"),
            label: String(i.title || i.name || i.label || ""),
          }))
        );
      }
      // اگر نتیجه‌ای نبود، fallback پیش‌فرض باقی می‌ماند
    }).catch(() => {/* fallback باقی می‌ماند */});
  }, []);

  return (
    <div className="lg:hidden flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
        aria-label="باز کردن منو"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex justify-start dir-rtl" style={{ background: "rgba(0,0,0,0.92)" }}>
          <div className="w-4/5 max-w-xs bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              {/* هدر منوی موبایل */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center font-black text-white text-sm">
                    A
                  </div>
                  <span className="font-black text-sm text-slate-900 dark:text-white">آکسون کور</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* لینک‌های ناوبری داینامیک */}
              <div className="mt-6 space-y-2">
                {navLinks.map((item) => {
                  const Icon = resolveIcon(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={17} className="text-[#0071e3]" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowLeft size={14} className="text-zinc-600" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* بخش پایینی منو */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new Event("open_cart_drawer"));
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#0071e3] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingBag size={16} />
                مشاهده سبد خرید
              </button>
              <div className="text-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                axoncore.ir | پشتیبانی رسمی
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
