// File Path: components/CartDrawer.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { formatPrice } from "@/lib/formatters";

export default function CartDrawer() {
  const { cartItems, isCartOpen, closeCart, updateQuantity, removeFromCart, finalPayable, totalAmount } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-md transition-opacity duration-300"
      onClick={closeCart}
      dir="rtl"
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: "translateZ(0)" }}
        className="w-full max-w-md h-full bg-[var(--modal-bg)] border-l border-[var(--card-border)] shadow-2xl flex flex-col justify-between p-5 sm:p-6 text-[var(--text-primary)] select-none animate-fadeIn"
      >
        {/* هدر کشو */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-lg font-black shadow-md">
              🛒
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black">سبد خرید شما</h2>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                {cartItems.length} قلم کالا انتخاب شده
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              closeCart();
            }}
            className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] hover:bg-rose-500 hover:text-white border border-[var(--card-border)] flex items-center justify-center text-sm font-black transition cursor-pointer"
            aria-label="بستن سبد خرید"
          >
            ✕
          </button>
        </div>

        {/* لیست اقلام سبد */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-none">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-5xl block">🛍️</span>
              <p className="text-xs font-bold text-[var(--text-secondary)]">سبد خرید شما خالی است.</p>
              <button
                type="button"
                onClick={closeCart}
                className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg cursor-pointer"
              >
                مشاهده کاتالوگ مانیتورها
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title || item.name || "کالا"}
                    className="w-14 h-14 object-contain rounded-2xl bg-[var(--modal-bg)] p-1 border border-[var(--card-border)] shrink-0"
                  />
                  <div className="overflow-hidden space-y-1">
                    <h3 className="text-xs font-black truncate max-w-[150px] sm:max-w-[180px]">
                      {item.title || item.name}
                    </h3>
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 block" suppressHydrationWarning>
                      {formatPrice(item.price)} تومان
                    </span>
                  </div>
                </div>

                {/* دکمه‌های کنترل تعداد ارگونومیک */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      updateQuantity(item.id, 1);
                    }}
                    className="w-9 h-9 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] flex items-center justify-center font-black text-sm transition cursor-pointer"
                  >
                    +
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-xs">
                    {item.quantity || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      if ((item.quantity || 1) > 1) {
                        updateQuantity(item.id, -1);
                      } else {
                        removeFromCart(item.id);
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-rose-500 hover:text-rose-500 flex items-center justify-center font-black text-sm transition cursor-pointer"
                  >
                    -
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* فوتر تسویه حساب */}
        {cartItems.length > 0 && (
          <div className="border-t border-[var(--card-border)] pt-4 space-y-3 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[var(--text-secondary)]">مبلغ کل قابل پرداخت:</span>
              <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                {formatPrice(finalPayable || totalAmount)} تومان
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={() => {
                soundEngine.playClick();
                closeCart();
              }}
              className="w-full min-h-[48px] py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-95 transition shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>تکمیل سفارش و صدور فاکتور 💳</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
