"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, Package, Phone, Home, Layers, ArrowLeft } from "lucide-react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "صفحه اصلی", icon: Home },
    { href: "/products", label: "کاتالوگ کالاها", icon: Layers },
    { href: "/track", label: "پیگیری سفارش", icon: Package },
    { href: "/contact", label: "تماس و پشتیبانی", icon: Phone },
  ];

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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start dir-rtl">
          <div className="w-4/5 max-w-xs bg-[#121214] border-l border-[#27272a] h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              {/* هدر منوی موبایل */}
              <div className="flex items-center justify-between pb-5 border-b border-[#27272a]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center font-black text-white text-sm">
                    A
                  </div>
                  <span className="font-black text-sm text-white">آکسون کور</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* لینک‌های ناوبری */}
              <div className="mt-6 space-y-2">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 text-zinc-300 hover:text-white font-bold text-xs transition"
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
            <div className="pt-6 border-t border-[#27272a] space-y-3">
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
              <div className="text-center text-[10px] text-zinc-500 font-bold">
                axoncore.ir | پشتیبانی رسمی
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
