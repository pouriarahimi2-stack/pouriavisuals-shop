"use client";
// File Path: components/CartDrawer.tsx
import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, finalPayable } = useCart() as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end md:flex-row md:justify-end font-sans select-none" dir="rtl">

      {/* پس‌زمینه */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
      />

      {/* بدنه کشو */}
      <div className="relative w-full md:w-[420px] md:h-full bg-white rounded-t-[2.5rem] md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90dvh", height: "auto", minHeight: "60dvh" }}
      >
        {/* دستگیره موبایل */}
        <div className="w-full flex justify-center pt-3 md:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* هدر */}
        <div className="flex items-center justify-between p-5 pt-4 md:pt-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900">سبد خرید</h2>
              <p className="text-xs font-bold text-slate-400">{cartItems.length} کالا</p>
            </div>
          </div>
          <button
            onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* لیست */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50" style={{ WebkitOverflowScrolling: "touch" }}>
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 opacity-60 py-16">
              <ShoppingBag size={56} strokeWidth={1} />
              <p className="font-bold text-sm">سبد خرید خالی است!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item: any) => (
                <div key={item.id} className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm flex gap-3 relative group">
                  <button
                    onClick={() => { soundEngine?.playClick?.(); removeFromCart(item.id); }}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-100 text-rose-500 rounded-full shadow flex items-center justify-center cursor-pointer hover:bg-rose-50 z-10"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl p-1.5 shrink-0 border border-slate-100/50 flex items-center justify-center">
                    <img src={item.image || "/placeholder.png"} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">{item.title}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-black text-sm text-slate-900">
                        {Number(item.price || 0).toLocaleString("fa-IR")} <span className="text-[9px] font-normal text-slate-400">ت</span>
                      </span>
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-full p-0.5">
                        <button onClick={() => { soundEngine?.playClick?.(); updateQuantity(item.id, item.quantity - 1); }} className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded-full shadow-sm cursor-pointer hover:bg-slate-100">
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                        <button onClick={() => { soundEngine?.playClick?.(); updateQuantity(item.id, item.quantity + 1); }} className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded-full shadow-sm cursor-pointer hover:bg-slate-100">
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* فوتر — با پدینگ کافی برای نمایش روی موبایل */}
        {cartItems.length > 0 && (
          <div
            className="bg-white border-t border-slate-100 p-5 pb-20 md:pb-5"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-bold text-sm">مبلغ قابل پرداخت:</span>
              <span className="text-xl font-black text-slate-900">
                {Number(finalPayable).toLocaleString("fa-IR")} <span className="text-xs font-normal text-slate-400">تومان</span>
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
              className="w-full h-14 flex items-center justify-center gap-2 font-black text-sm text-white rounded-2xl cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
              style={{ background: "linear-gradient(135deg,#0066ff 0%,#7c3aed 100%)" }}
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
