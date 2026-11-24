// File Path: components/CartDrawer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useSiteInfo } from "@/context/SiteInfoContext";
import { soundEngine } from "@/lib/soundEngine";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    finalPayable,
    discountAmount,
    appliedCoupon,
  } = useCart() as any;
  const { siteInfo } = useSiteInfo();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isCartOpen) return null;

  const layoutCfg = siteInfo?.homepage_layout_config || {};
  const sys =
    siteInfo?.settings ||
    siteInfo?.system_settings ||
    layoutCfg?.system_settings ||
    {};
  const freeShippingThreshold = Number(
    sys.freeShippingThreshold ?? sys.free_shipping_threshold ?? 0
  );
  const qualifiesFreeShip =
    freeShippingThreshold > 0 && finalPayable >= freeShippingThreshold;
  const remainingForFreeShip = Math.max(
    0,
    freeShippingThreshold - Number(finalPayable || 0)
  );
  const progressPct =
    freeShippingThreshold > 0
      ? Math.min(100, Math.round((Number(finalPayable || 0) / freeShippingThreshold) * 100))
      : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end md:flex-row md:justify-end font-sans select-none"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => {
          soundEngine?.playClick?.();
          closeCart();
        }}
      />

      <div
        className="relative w-full md:w-[420px] md:h-full bg-[var(--modal-bg)] text-[var(--text-primary)] border-t md:border-t-0 md:border-r border-[var(--card-border)] rounded-t-[2.5rem] md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300"
        style={{ maxHeight: "90dvh", height: "auto", minHeight: "60dvh" }}
      >
        <div className="w-full flex justify-center pt-3 md:hidden">
          <div className="w-12 h-1.5 bg-[var(--card-border)] rounded-full" />
        </div>

        <div className="flex items-center justify-between p-5 pt-4 md:pt-5 border-b border-[var(--card-border)] bg-[var(--modal-bg)]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[var(--input-bg)] flex items-center justify-center border border-[var(--card-border)] text-[var(--accent-blue)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-[var(--text-primary)]">
                سبد خرید
              </h2>
              <p className="text-xs font-bold text-[var(--text-secondary)]">
                {cartItems.length.toLocaleString("fa-IR")} قلم کالا
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine?.playClick?.();
              closeCart();
            }}
            className="w-10 h-10 flex items-center justify-center bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] rounded-full hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* نوار پیشرفت ارسال رایگان */}
        {cartItems.length > 0 && freeShippingThreshold > 0 && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 space-y-1.5 text-[11px]">
            <div className="font-black text-emerald-500 text-center">
              {qualifiesFreeShip
                ? "🎉 تبریک! سفارش شما مشمول ارسال رایگان شد"
                : `🚚 تنها ${remainingForFreeShip.toLocaleString("fa-IR")} تومان دیگر تا ارسال رایگان`}
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto p-4 bg-[var(--bg-primary)]/40"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-secondary)] opacity-75 py-16">
              <ShoppingBag size={56} strokeWidth={1.2} />
              <p className="font-bold text-sm">سبد خرید شما خالی است!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item: any) => {
                const itemKey = item.cartKey || String(item.id);
                return (
                  <div
                    key={itemKey}
                    className="bg-[var(--input-bg)] p-3.5 rounded-3xl border border-[var(--card-border)] shadow-sm flex gap-3 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine?.playClick?.();
                        removeFromCart(itemKey);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-[var(--modal-bg)] border border-[var(--card-border)] text-rose-500 rounded-full shadow flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition z-10"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="w-16 h-16 bg-[var(--modal-bg)] rounded-2xl p-1.5 shrink-0 border border-[var(--card-border)] flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                          {item.title}
                        </h3>
                        {item.selectedColor && (
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] block mt-0.5">
                            رنگ: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
                          {Number(item.price || 0).toLocaleString("fa-IR")}{" "}
                          <span className="text-[9px] font-sans font-normal text-[var(--text-secondary)]">
                            تومان
                          </span>
                        </span>
                        <div className="flex items-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine?.playClick?.();
                              updateQuantity(itemKey, item.quantity - 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-[var(--input-bg)] text-[var(--text-primary)] rounded-full shadow-sm cursor-pointer hover:border-[var(--accent-blue)]"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-black text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine?.playClick?.();
                              updateQuantity(itemKey, item.quantity + 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-[var(--input-bg)] text-[var(--text-primary)] rounded-full shadow-sm cursor-pointer hover:border-[var(--accent-blue)]"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="bg-[var(--modal-bg)] border-t border-[var(--card-border)] p-5 pb-20 md:pb-5 space-y-3">
            {appliedCoupon && discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold text-emerald-500">
                <span>🏷️ تخفیف کوپن ({appliedCoupon.code}):</span>
                <span className="font-mono">
                  -{Number(discountAmount).toLocaleString("fa-IR")} تومان
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] font-bold text-sm">
                مبلغ قابل پرداخت:
              </span>
              <span className="font-mono text-xl font-black text-[var(--text-primary)]">
                {Number(finalPayable).toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-sans font-normal text-[var(--text-secondary)]">
                  تومان
                </span>
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={() => {
                soundEngine?.playClick?.();
                closeCart();
              }}
              className="w-full h-14 flex items-center justify-center gap-2 font-black text-sm text-white rounded-2xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
              style={{
                background: "linear-gradient(135deg,#0066ff 0%,#7c3aed 100%)",
              }}
            >
              <span>تسویه حساب و تکمیل سفارش</span>
              <ArrowLeft size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}