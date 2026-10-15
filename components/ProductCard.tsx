"use client";
import React from "react";
import Link from "next/link";

// تابع ۱۰۰٪ امن استخراج عکس بدون استفاده از Regex که باعث ارور بیلد شده بود
export function getValidImageUrl(product: any) {
  if (!product) return "/placeholder.png";
  
  let img = product.image;
  
  if (typeof img === "string" && img.includes("[")) {
    try { const arr = JSON.parse(img); if (arr[0]) img = arr[0]; } catch(e) {}
  }
  
  if (!img || img === "/placeholder.png" || (typeof img === "string" && img.length < 5)) {
    if (Array.isArray(product.images) && product.images.length > 0) {
      img = product.images[0];
    } else if (typeof product.images === "string" && product.images.includes("[")) {
      try { const arr = JSON.parse(product.images); if (arr[0]) img = arr[0]; } catch(e) {}
    }
  }
  
  if (typeof img === "string" && img.length > 5) {
     // پاکسازی هرگونه کروشه یا کوتیشن اضافه بدون Regex
     img = img.split('"').join('').split('[').join('').split(']').join('').trim();
     if (img.startsWith("http") || img.startsWith("/")) return img;
  }
  
  return "/placeholder.png";
}

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const pId = product.id || product.slug || "";
  const title = product.title || product.name || "بدون نام";
  const finalPrice = product.discount_price || product.price || 0;
  const isAvailable = product.stock > 0 && product.is_available !== false;
  
  const imgUrl = getValidImageUrl(product);

  return (
    <div className="group flex flex-col bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:shadow-xl w-full h-full relative">
      <Link href={`/products/${pId}`} className="relative w-full aspect-square bg-white block overflow-hidden">
        <img 
          src={imgUrl} 
          alt={title} 
          className="w-full h-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" 
          loading="lazy" 
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-900 text-white font-black text-[10px] sm:text-xs shadow-lg">ناموجود</span>
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-2 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30">
        <div className="text-[9px] sm:text-[10px] font-black text-[var(--accent-blue)] truncate">
          {product.category || "لوازم عمومی"}
        </div>
        <Link href={`/products/${pId}`}>
          <h3 className="font-bold text-[11px] sm:text-xs text-[var(--text-primary)] line-clamp-2 leading-relaxed min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-[var(--accent-blue)] transition-colors">
            {title}
          </h3>
        </Link>
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="flex flex-col">
            {product.discount_price && product.discount_price < product.price && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through mb-0.5">
                {product.price.toLocaleString("fa-IR")}
              </span>
            )}
            <span className="font-mono font-black text-xs sm:text-sm text-[var(--text-primary)]">
              {finalPrice > 0 ? finalPrice.toLocaleString("fa-IR") + " تومان" : "ناموجود"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
