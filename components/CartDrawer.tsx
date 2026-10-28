"use client";
import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, finalPayable } = useCart() as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center md:justify-end font-sans select-none" dir="rtl">
      
      {/* پس‌زمینه تاریک و شیشه‌ای */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
      />

      {/* بدنه کشوی سبد خرید (در موبایل از پایین، در دسکتاپ از چپ) */}
      <div className="relative w-full h-[85dvh] mt-auto md:h-full md:mt-0 md:w-[420px] bg-white rounded-t-[2.5rem] md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-left duration-300 overflow-hidden">
        
        {/* دستگیره کوچک برای موبایل (Indicator) */}
        <div className="w-full flex justify-center pt-3 md:hidden absolute top-0 z-20">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* هدر کشو */}
        <div className="flex items-center justify-between p-6 pt-8 md:pt-6 border-b border-slate-100 bg-white/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">سبد خرید شما</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{cartItems.length} کالا در سبد</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* لیست محصولات */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400 opacity-60">
              <ShoppingBag size={64} strokeWidth={1} />
              <p className="font-bold text-sm">سبد خرید شما خالی است!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex gap-4 relative group">
                  
                  {/* دکمه حذف */}
                  <button 
                    onClick={() => { soundEngine?.playClick?.(); removeFromCart(item.id); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-100 text-rose-500 rounded-full shadow-md flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* تصویر محصول */}
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 shrink-0 border border-slate-100/50 flex items-center justify-center">
                    <img src={item.image || "/placeholder.png"} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>

                  {/* اطلاعات محصول */}
                  <div className="flex flex-col justify-between flex-1 py-0.5">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="font-black text-sm text-slate-900" dir="ltr">
                        {Number(item.price || 0).toLocaleString("fa-IR")} <span className="text-[10px] font-normal text-slate-500">تومان</span>
                      </div>
                      
                      {/* دکمه‌های تعداد (کپسولی) */}
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-full p-1 shadow-inner">
                        <button 
                          onClick={() => { soundEngine?.playClick?.(); updateQuantity(item.id, item.quantity - 1); }}
                          className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded-full shadow-sm cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => { soundEngine?.playClick?.(); updateQuantity(item.id, item.quantity + 1); }}
                          className="w-7 h-7 flex items-center justify-center bg-white text-slate-600 rounded-full shadow-sm cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* فوتر (دکمه پرداخت) */}
        {cartItems.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10 pb-safe">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-bold text-sm">مبلغ قابل پرداخت:</span>
              <span className="text-2xl font-black text-slate-900">
                {Number(finalPayable).toLocaleString("fa-IR")} <span className="text-sm font-normal text-slate-500">تومان</span>
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => { soundEngine?.playClick?.(); closeCart(); }}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] transition-all cursor-pointer"
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