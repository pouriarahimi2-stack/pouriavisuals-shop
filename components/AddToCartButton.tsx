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
}

export default function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
  const { cartItems, addToCart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);

  const cartItem = cartItems.find((i) => String(i.id) === String(product.id));
  const currentCount = cartItem?.quantity || 0;
  const isAvailable = (product.stock ?? 10) > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable || isAnimating) return;

    soundEngine.playAddToCart();
    setIsAnimating(true);

    addToCart({
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      image: product.image,
      stock: product.stock ?? 10,
      category: product.category || "تکنولوژی",
      quantity: 1,
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 1100);
  };

  return (
    <div className={"flex flex-col items-center gap-1 w-full select-none " + className} dir="rtl">
      <button
        type="button"
        disabled={!isAvailable}
        onClick={handleClick}
        className={`relative w-full overflow-hidden py-2.5 px-4 rounded-2xl font-black text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-40 ${
          isAnimating
            ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-[1.02]"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-blue-500/25"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 transition-transform duration-500 ${
            isAnimating ? "translate-x-1 scale-110" : ""
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-500 ${
              isAnimating ? "rotate-12 text-amber-300" : "text-white"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>

          <span className="tracking-tight">
            {isAnimating ? "به سبد اضافه شد!" : "افزودن به سبد خرید"}
          </span>
        </div>

        {isAnimating && (
          <span className="absolute inset-0 bg-white/20 animate-ping rounded-2xl pointer-events-none" />
        )}
      </button>

      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
        {currentCount > 0 ? `${currentCount} عدد در سبد شما` : "۰ عدد در سبد"}
      </span>
    </div>
  );
}
