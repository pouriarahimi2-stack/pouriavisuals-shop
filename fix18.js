#!/usr/bin/env node
// fix18.js — بازنویسی کامل ProductCard.tsx که regex fix17 خراب کرد
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(s) {
  let d = s;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "app"))) return d;
    d = path.dirname(d);
  }
  throw new Error("ریشه پیدا نشد!");
}
const root = findRoot(__dirname);
const pcPath = path.join(root, "components/ProductCard.tsx");

// فایل صحیح کامل با color_options و shipping_type در interface
const CORRECT_FILE = `"use client";
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
    color_options?:  { name: string; hex: string }[];
    shipping_type?:  string;
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
  const title       = product.title || product.name || "کالای دیجیتال";
  const basePrice   = Number(product.price || 0);
  const discountVal = product.discount_price || product.discountPrice;
  const finalPrice  = discountVal && Number(discountVal) > 0 ? Number(discountVal) : basePrice;
  const discPct     = discountVal && basePrice > 0 ? Math.round((1 - Number(discountVal) / basePrice) * 100) : 0;
  const [imgSrc, setImgSrc] = useState(getImg(product));
  const isLowStock  = product.stock !== undefined && product.stock > 0 && product.stock <= 3;

  return (
    <div className="group rounded-2xl sm:rounded-[1.75rem] bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)]/50 overflow-hidden shadow-sm flex flex-col justify-between relative transition-all duration-300 h-full">

      <Link href={"/products/" + product.id} onClick={() => soundEngine.playClick()} className="flex-1 block p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* تصویر */}
        <div className="relative aspect-square rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/5 overflow-hidden flex items-center justify-center p-2 sm:p-3">
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            onError={() => { if (imgSrc !== "/placeholder.png") setImgSrc("/placeholder.png"); }}
          />
          {discPct > 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[9px] sm:text-[10px] font-black shadow">
              {discPct}٪
            </span>
          )}
          {isLowStock && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-amber-500/90 text-white text-[8px] sm:text-[9px] font-black">
              {product.stock} عدد
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
              <span className="px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-black">ناموجود</span>
            </div>
          )}
        </div>

        {/* اطلاعات */}
        <div className="space-y-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-[var(--accent-blue)] block truncate">
            {product.category || "لوازم دیجیتال"}
          </span>
          <h3 className="text-[11px] sm:text-xs font-black text-[var(--text-primary)] line-clamp-2 leading-relaxed min-h-[32px] sm:min-h-[36px]">
            {title}
          </h3>
        </div>
      </Link>

      {/* قیمت و دکمه */}
      <div className="p-3 sm:p-4 pt-0 border-t border-[var(--card-border)]/50 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between text-xs">
          {discountVal && Number(discountVal) > 0 ? (
            <div className="space-y-0.5 text-left">
              <span className="line-through text-slate-400 text-[9px] sm:text-[10px] block" suppressHydrationWarning>
                {formatPrice(basePrice)}
              </span>
              <span className="text-emerald-500 font-black text-sm sm:text-base block" suppressHydrationWarning>
                {formatPrice(finalPrice)} ت
              </span>
            </div>
          ) : (
            <span className="text-[var(--text-primary)] font-black text-sm sm:text-base" suppressHydrationWarning>
              {formatPrice(basePrice)} ت
            </span>
          )}
        </div>
        <AddToCartButton
          product={{ ...product, image: imgSrc, color_options: product.color_options, shipping_type: product.shipping_type }}
          showCounter={false}
        />
      </div>
    </div>
  );
}
`;

fs.writeFileSync(pcPath, CORRECT_FILE, "utf8");
console.log("✅ ProductCard.tsx کامل بازنویسی شد");

console.log("🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) { console.error("❌ Build ناموفق!"); process.exit(1); }

console.log("📤 Git...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  execSync(`git commit -m "fix(ProductCard): restore correct file with color_options interface

- fix17 regex broke the file by over-matching
- Complete rewrite with correct interface including color_options and shipping_type
- All original JSX preserved

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch (e) { console.error("Git:", e.message); }

console.log("\n✅ fix18 کامل!");