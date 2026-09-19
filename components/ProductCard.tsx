"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { formatPrice } from "@/lib/formatters";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = product?.title || product?.name || "محصول استودیو";
  const mainImage = (product?.images && product.images[0]) || product?.image || "/placeholder.png";
  const price = Number(product?.price || 0);
  const discountPrice = product?.discount_price || product?.discountPrice ? Number(product.discount_price || product.discountPrice) : null;
  const isAvailable = product?.is_available !== false && (product?.stock === undefined || Number(product.stock) > 0);

  return (
    <div className="group relative rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] p-4 sm:p-5 transition-all duration-300 shadow-md flex flex-col justify-between font-sans select-none" dir="rtl">
      <div>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full relative block">
            <Image
              src={mainImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading="lazy"
              className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
          <span className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold border border-white/10 z-10">
            {product?.category || "تخصصی"}
          </span>
        </div>

        <Link href={"/products/" + product.id} className="block space-y-1">
          <h3 className="font-black text-xs sm:text-sm text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--accent-blue)] transition">
            {title}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium">
            {product?.warranty || "گارانتی اصالت طلایی"}
          </p>
        </Link>
      </div>

      <div className="pt-4 mt-2 border-t border-[var(--card-border)] space-y-3">
        <div className="flex items-baseline justify-between" suppressHydrationWarning>
          <span className="text-[10px] text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
          <div className="text-left font-mono">
            {discountPrice ? (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 line-through">
                  {mounted ? formatPrice(price) : ""}
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {mounted ? formatPrice(discountPrice) : ""} تومان
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                {mounted ? formatPrice(price) : ""} تومان
              </span>
            )}
          </div>
        </div>

        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
