"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { userBehavior } from "@/lib/userBehavior";
import { formatPrice } from "@/lib/formatters";
import ProductExplodedView from "@/components/ProductExplodedView";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product }: { product: any }) {
  const [mounted, setMounted] = useState(false);
  const [isTeardownOpen, setIsTeardownOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const title = product.title || product.title_fa || product.name || "کالای تکنولوژی";
  const price = Number(product.price) || 55800000;
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : undefined);
  const currentPrice = discountPrice || price;
  const stockCount = product.stock !== undefined ? Number(product.stock) : 10;
  const mainImage = product.images?.[0] || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600";
  const category = product.category || "تکنولوژی";
  const isAvailable = product.is_available !== false && stockCount > 0;

  return (
    <>
      <div
        onClick={() => userBehavior.trackProductView(product.id, category)}
        className="glass-morphism rounded-[2.2rem] overflow-hidden p-5 flex flex-col justify-between group select-none relative"
        dir="rtl"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full flex items-center justify-center">
            <img src={mainImage} alt={title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </Link>
          
          <span className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold border border-white/10">
            {category}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playExplodeShift();
              setIsTeardownOpen(true);
            }}
            className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-blue-600 text-white font-bold text-[10px] border border-white/20 backdrop-blur-md transition flex items-center gap-1 shadow-md cursor-pointer"
            title="مشاهده کالبدشکافی ۳D"
          >
            <span>🧬</span>
            <span>کالبدشکافی ۳D</span>
          </button>
        </div>

        <div className="space-y-2 mb-4 text-right flex-grow">
          <span className="text-[var(--accent-blue)] text-xs font-bold block">{product.brand || "Apple"}</span>
          <Link href={"/products/" + product.id}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug hover:text-[var(--accent-blue)] transition">{title}</h3>
          </Link>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">{product.short_description || product.description || "دارای گارانتی اصالت طلایی و ارسال پیشتاز"}</p>
        </div>

        <div className="pt-3 border-t border-[var(--card-border)] space-y-3 mt-auto">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-base font-mono font-black text-[var(--text-primary)]" suppressHydrationWarning>{formatPrice(currentPrice)} تومان</span>
            <span className="text-[10px] font-bold text-emerald-500">{isAvailable ? "موجود ✓" : "ناموجود"}</span>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              title,
              price: currentPrice,
              image: mainImage,
              stock: stockCount,
              category,
            }}
          />
        </div>
      </div>

      <ProductExplodedView
        productId={product.id}
        productTitle={title}
        category={category}
        isOpen={isTeardownOpen}
        onClose={() => setIsTeardownOpen(false)}
      />
    </>
  );
}
