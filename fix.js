/**
 * AXON CORE - Fix ProductCard duplicate JSX attributes (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("\x1b[36m[HOTFIX]\x1b[0m بازنویسی استاندارد و بدون باگ components/ProductCard.tsx...");

const productCardCleanCode = `"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { formatPrice } from "@/lib/formatters";

interface ProductCardProps {
  product: any;
  onOpenQuickView?: (product: any) => void;
}

export default function ProductCard({ product, onOpenQuickView }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = product?.title || product?.name || "محصول استودیو";
  const mainImage =
    (product?.images && product.images[0]) ||
    product?.image ||
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800";

  const price = Number(product?.price || 0);
  const discountPrice = product?.discount_price ? Number(product.discount_price) : null;
  const isAvailable = product?.is_available !== false && (product?.stock === undefined || Number(product.stock) > 0);

  return (
    <div
      className="group relative rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] p-4 transition-all duration-300 shadow-md flex flex-col justify-between font-sans select-none"
      dir="rtl"
    >
      <div>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--input-bg)] mb-4 flex items-center justify-center p-3 border border-[var(--card-border)]">
          <Link href={"/products/" + product.id} className="w-full h-full relative block">
            <Image
              src={mainImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          <span className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold border border-white/10">
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
`;

fs.writeFileSync(path.join(process.cwd(), 'components/ProductCard.tsx'), productCardCleanCode.trim() + '\n', 'utf8');
console.log("\x1b[32m✔ کامپوننت ProductCard با استفاده استاندارد از Image کاملاً بازنویسی شد.\x1b[0m");

// =============================================================================
// بررسی بیلد و ارسال نهایی
// =============================================================================
console.log("بررسی کامپایل بیلد نهایی (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمام مراحل کامپایل با موفقیت کامل پاس شدند!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(ProductCard): rewrite with clean next/image fill layout and valid JSX attributes"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ نسخه نهایی و تمیز پروژه با موفقیت در مخزن ثبت و در ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}