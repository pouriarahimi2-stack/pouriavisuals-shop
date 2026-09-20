"use client";

import React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, totalPrice, finalPayable, discountAmount } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-start dir-rtl animate-fadeIn font-sans select-none">
      <div className="w-full sm:max-w-md bg-[var(--modal-bg)] border-l border-[var(--card-border)] h-full flex flex-col justify-between p-6 shadow-2xl text-[var(--text-primary)] animate-in slide-in-from-right duration-200">
        <div>
          {/* هدر کشو */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[var(--accent-blue)]" />
              <h2 className="text-base font-black">سبد خرید شما</h2>
              <span className="text-xs text-[var(--text-secondary)] font-bold">({cartItems.length} قلم کالا)</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                closeCart();
              }}
              className="p-2 rounded-xl hover:bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* لیست اقلام */}
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="py-24 text-center text-xs text-[var(--text-secondary)] font-bold space-y-2">
                <span className="text-4xl block">🛍️</span>
                <p>سبد خرید شما در حال حاضر خالی است.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 shadow-sm">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title}
                    className="w-14 h-14 object-contain rounded-xl bg-black/10 dark:bg-white/5 p-1 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black truncate">{item.title}</h4>
                    <div className="text-[11px] text-emerald-500 font-bold mt-1 font-mono" suppressHydrationWarning>
                      {formatPrice(item.discountPrice || item.price)} تومان
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[var(--modal-bg)] px-2 py-1 rounded-xl border border-[var(--card-border)]">
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        updateQuantity(item.id, 1);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Plus size={13} />
                    </button>
                    <span className="text-xs font-black px-1 font-mono">{item.quantity}</span>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        updateQuantity(item.id, -1);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Minus size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      removeFromCart(item.id);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="حذف از سبد"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* فوتر تسویه حساب */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-[var(--card-border)] space-y-4">
            <div className="space-y-1.5 text-xs font-bold">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-500">
                  <span>سود شما از تخفیف:</span>
                  <span className="font-mono" suppressHydrationWarning>{formatPrice(discountAmount)} تومان</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">مبلغ قابل پرداخت فاکتور:</span>
                <div className="text-left font-black">
                  <div className="text-base text-emerald-500 font-mono" suppressHydrationWarning>
                    {formatPrice(finalPayable)} تومان
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={() => closeCart()}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition cursor-pointer"
            >
              <span>تکمیل اطلاعات و تسویه حساب</span>
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
