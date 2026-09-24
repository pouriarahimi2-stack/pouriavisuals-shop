"use client";
import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductCardProps {
  product: {
    id:             string | number;
    title?:         string;
    name?:          string;
    price:          number;
    discount_price?: number | null;
    discountPrice?:  number | null;
    image?:          string | null;
    image_url?:      string | null;
    images?:         string[];
    category?:       string;
    stock?:          number;
    warranty?:       string;
  };
}

function getProductImage(product: ProductCardProps["product"]): string {
  // اولویت: images[] → image_url → image
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    if (first && first.startsWith("http")) return first;
    if (first && first.startsWith("/"))    return first;
  }
  if (product.image_url && product.image_url.trim()) return product.image_url;
  if (product.image      && product.image.trim())     return product.image;
  return "/placeholder.png";
}

export default function ProductCard({ product }: ProductCardProps) {
  const title        = product.title || product.name || "کالای دیجیتال";
  const displayPrice = Number(product.price || 0);
  const discountVal  = product.discount_price || product.discountPrice;
  const finalPrice   = discountVal && Number(discountVal) > 0 ? Number(discountVal) : displayPrice;
  const discountPct  = discountVal && displayPrice > 0
    ? Math.round((1 - Number(discountVal) / displayPrice) * 100)
    : 0;

  const rawImage      = getProductImage(product);
  const [imgSrc, setImgSrc] = useState(rawImage);

  const isLowStock = product.stock !== undefined && product.stock <= 3 && product.stock > 0;

  return (
    <div className={
      "group rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] " +
      "hover:border-[var(--accent-blue)]/60 overflow-hidden shadow-sm " +
      "flex flex-col justify-between relative transition-all duration-300"
    }>
      <div className={
        "absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 " +
        "bg-gradient-to-b from-[var(--accent-blue)]/5 to-transparent " +
        "transition-opacity duration-500 pointer-events-none"
      } />

      <Link href={"/products/" + product.id} onClick={() => soundEngine.playClick()} className="space-y-3 block p-4">
        {/* تصویر با fallback */}
        <div className="relative aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 overflow-hidden flex items-center justify-center p-3">
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => {
              if (imgSrc !== "/placeholder.png") setImgSrc("/placeholder.png");
            }}
          />
          {discountPct > 0 && (
            <span className={
              "absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl " +
              "bg-gradient-to-l from-rose-600 to-rose-500 text-white text-[10px] font-black shadow-lg"
            }>
              {discountPct}٪ تخفیف
            </span>
          )}
          {isLowStock && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xl bg-amber-500/90 text-white text-[9px] font-black">
              فقط {product.stock} عدد
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <span className="px-3 py-1 rounded-xl bg-black/70 text-white text-xs font-black">ناموجود</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--accent-blue)] block truncate">
            {product.category || "لوازم دیجیتال"}
          </span>
          <h3 className={
            "text-xs font-black text-[var(--text-primary)] line-clamp-2 leading-relaxed " +
            "min-h-[36px] group-hover:text-[var(--accent-blue)] transition-colors duration-200"
          }>
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
                  {formatPrice(finalPrice)} ت
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-primary)] font-black text-sm" suppressHydrationWarning>
                {formatPrice(displayPrice)} ت
              </span>
            )}
          </div>
        </div>
        <AddToCartButton product={{ ...product, image: imgSrc }} showCounter={false} />
      </div>
    </div>
  );
}
