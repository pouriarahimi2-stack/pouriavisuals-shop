"use client";
import React from "react";
import Link from "next/link";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const pId = product.id || product.slug || "";
  const title = product.title || product.name || "محصول";
  const finalPrice = product.discount_price || product.price || 0;
  const isAvailable = product.stock > 0 && product.is_available !== false;
  
  // انتخاب عکس: تضمین پر شدن کامل کادر بدون حاشیه سفید مزاحم
  const imgUrl = product.image || (product.images && product.images[0]) || "/placeholder.png";

  return (
    <div className="group relative flex flex-col bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 w-full min-w-[220px] max-w-[280px]">
      
      {/* بخش تصویر: مربع کامل، عکس تمام قاب را پر می‌کند */}
      <Link href={`/products/${pId}`} className="relative w-full aspect-square bg-white block overflow-hidden">
        <img 
          src={imgUrl} 
          alt={title} 
          className="w-full h-full object-contain mix-blend-multiply p-2 transition-transform duration-500 group-hover:scale-105" 
          loading="lazy" 
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-xs shadow-lg">ناموجود</span>
          </div>
        )}
      </Link>

      {/* اطلاعات محصول */}
      <div className="p-4 flex flex-col flex-1 gap-2 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30">
        <div className="text-[10px] font-black text-[var(--accent-blue)] truncate">
          {product.category || "لوازم ورزشی"}
        </div>
        
        <Link href={`/products/${pId}`}>
          <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] line-clamp-2 leading-relaxed min-h-[2.5rem] group-hover:text-[var(--accent-blue)] transition-colors">
            {title}
          </h3>
        </Link>

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex flex-col">
            {product.discount_price && product.discount_price < product.price && (
              <span className="text-[10px] text-slate-400 line-through mb-0.5">
                {product.price.toLocaleString("fa-IR")}
              </span>
            )}
            <span className="font-mono font-black text-sm text-[var(--text-primary)]">
              {finalPrice > 0 ? finalPrice.toLocaleString("fa-IR") + " تومان" : "ناموجود"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
