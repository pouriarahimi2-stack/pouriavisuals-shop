"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const displayImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : product.image || "";

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart({
      id: product.id,
      title: product.name,
      price: product.price,
      image: displayImage,
      quantity: 1,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-5 flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300 hover:border-[var(--accent-blue)] group">
      <div>
        {/* فریم تصویر */}
        <Link
          href={`/products/${product.id}`}
          className="w-full h-56 rounded-2xl bg-[var(--input-bg)] p-4 flex items-center justify-center overflow-hidden block relative mb-4"
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[var(--text-secondary)] text-xs font-bold">
              <span className="text-3xl">📦</span>
              <span>بدون تصویر</span>
            </div>
          )}
        </Link>

        {/* تگ وضعیت و دسته‌بندی */}
        <div className="flex items-center justify-between gap-2 mb-3 text-[11px] font-bold">
          <span
            className={`px-3 py-1 rounded-full ${
              isOutOfStock
                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            }`}
          >
            {isOutOfStock ? "ناموجود" : "موجود در انبار"}
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20">
            {product.category_id || product.category || "کالای دیجیتال"}
          </span>
        </div>

        {/* نام و زیرعنوان */}
        <Link href={`/products/${product.id}`} className="block space-y-1 text-right">
          <h3 className="font-black text-sm text-[var(--text-primary)] leading-snug line-clamp-1 group-hover:text-[var(--accent-blue)] transition">
            {product.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium">
            {product.title_fa || product.name}
          </p>
        </Link>
      </div>

      {/* قیمت و دکمه افزودن */}
      <div className="pt-4 mt-3 border-t border-[var(--card-border)] space-y-3">
        <div className="text-right text-xs font-mono font-black text-[var(--accent-blue)]">
          {Number(product.price).toLocaleString("fa-IR")}{" "}
          <span className="text-[10px] font-normal text-[var(--text-secondary)]">تومان</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-3 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2 ${
            isOutOfStock
              ? "bg-zinc-400 dark:bg-zinc-800 text-zinc-200 cursor-not-allowed"
              : isAdded
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-[var(--accent-blue)] hover:opacity-90 text-white shadow-blue-500/20"
          }`}
        >
          <span>{isOutOfStock ? "ناموجود" : isAdded ? "✓ اضافه شد" : "افزودن به سبد خرید 🛍️"}</span>
        </button>
      </div>
    </div>
  );
}