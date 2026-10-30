"use client";
import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { soundEngine } from "@/lib/soundEngine";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductCardProps {
  product: {
    id:              string | number;
    title?:          string;
    name?:           string;
    price:           number;
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

function getImg(p: ProductCardProps["product"]): string {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const f = p.images[0];
    if (f && (f.startsWith("http") || f.startsWith("/"))) return f;
  }
  if (p.image_url?.trim()) return p.image_url;
  if (p.image?.trim())     return p.image;
  return "/placeholder.png";
}

export default function ProductCard({ product }: ProductCardProps) {
  const title        = product.title || product.name || "کالای دیجیتال";
  const basePrice    = Number(product.price || 0);
  const discountVal  = product.discount_price || product.discountPrice;
  const finalPrice   = discountVal && Number(discountVal) > 0 ? Number(discountVal) : basePrice;
  const discPct      = discountVal && basePrice > 0 ? Math.round((1 - Number(discountVal) / basePrice) * 100) : 0;
  const [imgSrc, setImgSrc] = useState(getImg(product));
  const isLowStock   = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className="group card-glass card-liquid-shine card-hover-glow flex flex-col justify-between relative h-full overflow-hidden"
      style={{ borderRadius: "1.5rem" }}
    >
      {/* لایه glow پس‌زمینه روی hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 0%, var(--accent-glow) 0%, transparent 70%)",
          borderRadius: "inherit",
        }}
      />

      <Link
        href={"/products/" + product.id}
        onClick={() => soundEngine.playClick()}
        className="flex-1 block p-3 sm:p-4 space-y-2 sm:space-y-3 relative z-10"
      >
        {/* تصویر */}
        <div
          className="relative aspect-square overflow-hidden flex items-center justify-center p-3 sm:p-4"
          style={{
            borderRadius: "1.25rem",
            background: "var(--input-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-500"
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.07)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
            onError={() => { if (imgSrc !== "/placeholder.png") setImgSrc("/placeholder.png"); }}
          />

          {discPct > 0 && (
            <span className="badge-capsule badge-discount absolute top-2.5 right-2.5 text-[10px]">
              {discPct}٪ تخفیف
            </span>
          )}
          {isLowStock && (
            <span className="badge-capsule badge-warning absolute top-2.5 left-2.5 text-[9px]">
              تنها {product.stock} عدد
            </span>
          )}
          {isOutOfStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ borderRadius: "inherit", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            >
              <span
                className="badge-capsule text-[11px]"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                ناموجود
              </span>
            </div>
          )}
        </div>

        {/* اطلاعات محصول */}
        <div className="space-y-1.5 px-0.5">
          {product.category && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black"
              style={{
                background: "linear-gradient(135deg, var(--accent-blue), var(--accent-violet))",
                color: "#fff",
                opacity: 0.9,
              }}
            >
              {product.category}
            </span>
          )}
          <h3 className="text-[11px] sm:text-xs font-black text-[var(--text-primary)] line-clamp-2 leading-relaxed min-h-[30px] sm:min-h-[34px]">
            {title}
          </h3>
        </div>
      </Link>

      {/* قیمت و دکمه */}
      <div
        className="p-3 sm:p-4 pt-2 relative z-10"
        style={{ borderTop: "1px solid var(--glass-border)" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          {discountVal && Number(discountVal) > 0 ? (
            <div className="space-y-0.5">
              <span className="line-through text-[var(--text-secondary)] text-[9px] sm:text-[10px] block" suppressHydrationWarning>
                {formatPrice(basePrice)} ت
              </span>
              <span className="font-black text-sm sm:text-base block" style={{ color: "var(--accent-blue)" }} suppressHydrationWarning>
                {formatPrice(finalPrice)} ت
              </span>
            </div>
          ) : (
            <span className="text-[var(--text-primary)] font-black text-sm sm:text-base" suppressHydrationWarning>
              {formatPrice(basePrice)} ت
            </span>
          )}
        </div>
        <AddToCartButton product={{ ...product, image: imgSrc }} showCounter={false} />
      </div>
    </div>
  );
}
