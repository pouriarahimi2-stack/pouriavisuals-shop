// File Path: components/ProductCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = product.title || product.title_fa || product.name || "کالای دیجیتال تخصصی";
  const price = Number(product.price) || 0;
  const discountPrice =
    product.discountPrice !== undefined && product.discountPrice !== null
      ? Number(product.discountPrice)
      : product.discount_price !== undefined && product.discount_price !== null
      ? Number(product.discount_price)
      : undefined;

  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10;

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image_url || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"];

  const mainImage = images[0];
  const category = product.category || product.category_name || "تجهیزات تخصصی";
  const isAvailable =
    product.is_available !== false &&
    product.isAvailable !== false &&
    stockCount > 0;

  const discountPercent =
    discountPrice && discountPrice < price
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playAddToCart();
    userBehavior.trackProductView(product.id, category);
    addToCart({
      id: product.id,
      title,
      name: title,
      price: currentPrice,
      image: mainImage,
      stock: stockCount,
      quantity: 1,
    });
    router.push("/checkout");
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playAddToCart();
    userBehavior.trackProductView(product.id, category);
    addToCart({
      id: product.id,
      title,
      name: title,
      price: currentPrice,
      image: mainImage,
      stock: stockCount,
      quantity: 1,
    });
  };

  return (
    <div
      onClick={() => userBehavior.trackProductView(product.id, category)}
      className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[2.2rem] p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-2xl hover:border-[var(--accent-blue)] transition-all duration-300 group select-none relative"
      dir="rtl"
    >
      {/* باکس تصویر محصول */}
      <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-3.5 flex items-center justify-center p-3 border border-[var(--card-border)]">
        <Link href={`/products/${product.id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={mainImage}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-lg">
            {discountPercent}٪- تخفیف
          </span>
        )}

        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
          {product.badge || category}
        </span>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-black shadow-md">
              ناموجود در انبار
            </span>
          </div>
        )}
      </div>

      {/* اطلاعات و تیتر کالا */}
      <div className="flex flex-col flex-grow space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--accent-blue)] font-extrabold">{product.brand || "Axon Pro"}</span>
          <span className={`font-bold ${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
            {isAvailable ? "موجود در انبار ✓" : "ناموجود"}
          </span>
        </div>

        <Link href={`/products/${product.id}`} className="hover:text-[var(--accent-blue)] transition-colors">
          <h3 
            className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2"
            style={{ direction: "rtl", textAlign: "right" }}
          >
            {title}
          </h3>
        </Link>

        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">
          {product.short_description || product.description || "تجهیزات تخصصی با گارانتی اصالت طلایی"}
        </p>
      </div>

      {/* قیمت و دکمه‌های خرید سریع */}
      <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {discountPrice && discountPrice < price && (
              <span className="text-[10px] line-through text-[var(--text-secondary)] font-mono" suppressHydrationWarning>
                {mounted ? price.toLocaleString("fa-IR") : price}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono" suppressHydrationWarning>
              {mounted ? currentPrice.toLocaleString("fa-IR") : currentPrice}{" "}
              <span className="text-xs font-bold font-sans">تومان</span>
            </span>
          </div>
          <Link href={`/products/${product.id}`} className="text-[11px] font-black text-[var(--accent-blue)] hover:underline transition">
            بررسی کالا ←
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--input-bg)] text-[var(--text-primary)] text-xs font-black rounded-xl border border-[var(--card-border)] hover:border-[var(--accent-blue)] cursor-pointer disabled:opacity-40 transition shadow-sm"
          >
            🛒 سبد خرید
          </button>
          <button
            onClick={handleQuickBuy}
            disabled={!isAvailable}
            className="py-2.5 bg-[var(--accent-blue)] text-white text-xs font-black rounded-xl shadow-md hover:opacity-90 cursor-pointer disabled:opacity-40 transition"
          >
            ⚡ خرید سریع
          </button>
        </div>
      </div>
    </div>
  );
}