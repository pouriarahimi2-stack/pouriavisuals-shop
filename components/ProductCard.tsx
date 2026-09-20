"use client";

import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductCardProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    price: number;
    discount_price?: number | null;
    discountPrice?: number | null;
    image?: string | null;
    images?: string[];
    category?: string;
    stock?: number;
    warranty?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const title = product.title || product.name || "کالای دیجیتال";
  const displayPrice = Number(product.price || 0);
  const discountVal = product.discount_price || product.discountPrice;
  const finalPrice = discountVal && Number(discountVal) > 0 ? Number(discountVal) : displayPrice;

  // حل ریشه‌ای: اگر عکس placeholder سیاه بود، عکس باکیفیت و واقعی لود می‌شود
  let imageSrc = (Array.isArray(product.images) && product.images[0]) || product.image || "";
  if (!imageSrc || imageSrc.includes("placeholder.png")) {
    imageSrc = "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80";
  }

  return (
    <div className="group rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl">
      <Link href={`/products/${product.id}`} onClick={() => soundEngine.playClick()} className="space-y-3 block p-4">
        <div className="relative aspect-square rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden flex items-center justify-center p-2">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
          />
          {discountVal && Number(discountVal) > 0 && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black shadow-md">
              تخفیف ویژه
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--accent-blue)] block truncate">
            {product.category || "لوازم هوشمند و دیجیتال"}
          </span>
          <h3 className="text-xs font-black text-[var(--text-primary)] line-clamp-2 leading-relaxed min-h-[36px] group-hover:text-[var(--accent-blue)] transition">
            {title}
          </h3>
        </div>
      </Link>

      <div className="p-4 pt-0 space-y-3 border-t border-[var(--card-border)]/50 mt-auto">
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-[10px] text-[var(--text-secondary)] font-bold">قیمت:</span>
          <div className="text-left font-mono">
            {discountVal && Number(discountVal) > 0 ? (
              <div className="space-y-0.5">
                <span className="line-through text-slate-400 text-[10px] block" suppressHydrationWarning>
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-emerald-500 font-black text-sm block" suppressHydrationWarning>
                  {formatPrice(finalPrice)} تومان
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-primary)] font-black text-sm" suppressHydrationWarning>
                {formatPrice(displayPrice)} تومان
              </span>
            )}
          </div>
        </div>

        {/* دکمه اختصاصی با انیمیشن دقیق چرخ‌دستی و باز شدن به‌موقع پس از ۱.۲۵ ثانیه */}
        <AddToCartButton product={{ ...product, image: imageSrc }} showCounter={false} />
      </div>
    </div>
  );
}
