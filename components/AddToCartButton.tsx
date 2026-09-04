// File Path: components/AddToCartButton.tsx
"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: string | number;
    title: string;
    price: number;
    image: string;
    stock?: number;
    category?: string;
  };
  className?: string;
  showCounter?: boolean;
}

export default function AddToCartButton({
  product,
  className = "",
  showCounter = true,
}: AddToCartButtonProps) {
  const { cartItems, addToCart, openCart } = useCart();
  const [animState, setAnimState] = useState<"idle" | "adding">("idle");
  const [bumpCounter, setBumpCounter] = useState(false);

  const cartItem = cartItems.find((i) => String(i.id) === String(product.id));
  const currentCount = cartItem?.quantity || 0;
  const stockLimit = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;
  const isAvailable = stockLimit > 0;
  const isMaxReached = currentCount >= stockLimit;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable || isMaxReached || animState !== "idle") return;

    soundEngine.playAddToCart();
    setAnimState("adding");

    // افزودن کالا به سبد خرید بدون باز شدن فوری کشو
    addToCart(
      {
        id: product.id,
        title: product.title,
        name: product.title,
        price: product.price,
        image: product.image,
        stock: stockLimit,
        category: product.category || "تکنولوژی",
        quantity: 1,
      },
      false
    );

    // انیمیشن جهش فنری شمارنده
    setTimeout(() => {
      setBumpCounter(true);
      setTimeout(() => setBumpCounter(false), 500);
    }, 600);

    // پایان انیمیشن (۱۲۵۰ میلی‌ثانیه): بازگشت به حالت اولیه و باز شدن نرم سبد خرید
    setTimeout(() => {
      setAnimState("idle");
      openCart();
    }, 1250);
  };

  const isAnimating = animState === "adding";

  return (
    <div className={`flex flex-col items-center gap-1.5 w-full select-none ${className}`} dir="rtl" suppressHydrationWarning>
      
      {/* دکمه کپسولی پیوسته مشکی مات مطابق ویدیو با فیکس موقعیت بدون پرش */}
      <button
        type="button"
        disabled={!isAvailable || isMaxReached}
        onClick={handleAddToCart}
        className={`relative w-full h-[52px] rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer shadow-xl active:scale-[0.98] border border-white/15 ${
          !isAvailable || isMaxReached
            ? "bg-slate-900/70 opacity-40 cursor-not-allowed text-slate-400"
            : "bg-[#0b0f19] hover:bg-[#111827] text-white hover:border-blue-500/50 hover:shadow-blue-500/20"
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden">
          
          {/* کانتینر متحرک چرخ‌دستی و بسته */}
          <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
              isAnimating
                ? "absolute left-1/2 -translate-x-1/2 animate-kinetic-cart-left z-20"
                : "translate-x-0"
            }`}
          >
            {/* بسته محصول سفید با ربان آبی که مستقیماً داخل سبد سقوط می‌کند */}
            {isAnimating && (
              <div className="absolute -top-4 left-[9px] z-30 pointer-events-none animate-kinetic-item-drop">
                <div className="w-3.5 h-3.5 rounded-[3px] bg-white shadow-lg border border-slate-300 flex items-center justify-center relative">
                  <span className="w-full h-[1.5px] bg-blue-500 absolute top-1/2 -translate-y-1/2" />
                  <span className="h-full w-[1.5px] bg-blue-500 absolute left-1/2 -translate-x-1/2" />
                </div>
              </div>
            )}

            {/* آیکون چرخ‌دستی که به سمت چپ می‌راند */}
            <svg
              className="w-6 h-6 text-white shrink-0 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3H5.2L7.1 14.2C7.25 15.1 8 15.8 8.9 15.8H18.2C19.1 15.8 19.85 15.1 20 14.2L21.4 7.2C21.55 6.4 20.95 5.7 20.15 5.7H6.2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-left origin-[9.5px_19.5px]" : ""}
              />
              <circle
                cx="17.5"
                cy="19.5"
                r="1.8"
                fill="currentColor"
                className={isAnimating ? "animate-kinetic-wheel-left origin-[17.5px_19.5px]" : ""}
              />
            </svg>
          </div>

          {/* متن دکمه که هنگام کلیک با ترنزیشن محو می‌شود */}
          <span
            className={`font-black text-xs tracking-wider uppercase mr-3 transition-all duration-300 text-slate-100 whitespace-nowrap ${
              isAnimating
                ? "opacity-0 scale-75 -translate-x-6 pointer-events-none w-0 overflow-hidden"
                : "opacity-100 scale-100 translate-x-0"
            }`}
          >
            {isMaxReached
              ? "حداکثر موجودی انبار"
              : !isAvailable
              ? "ناموجود در انبار"
              : "افزودن به سبد خرید"}
          </span>
        </div>

        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/0 via-white/5 to-white/10 pointer-events-none" />
      </button>

      {/* شمارنده زیر دکمه با انیمیشن جهش الاستیک */}
      {showCounter && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] font-sans" suppressHydrationWarning>
          <span
            className={`font-mono font-black transition-all duration-300 ${
              bumpCounter ? "animate-kinetic-counter-bump text-emerald-500 font-extrabold" : "text-[var(--text-primary)]"
            }`}
          >
            {currentCount}
          </span>
          <span>عدد در سبد شما</span>
        </div>
      )}
    </div>
  );
}
