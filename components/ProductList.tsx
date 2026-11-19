// File Path: components/ProductList.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { productService, Product } from "@/services/productService";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";

export interface ProductListProps {
  initialProducts?: Product[];
  customHeading?: string;
  customSubtitle?: string;
}

export default function ProductList({
  initialProducts,
  customHeading,
  customSubtitle,
}: ProductListProps = {}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(
    !initialProducts || initialProducts.length === 0
  );

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) {
      loadProducts();
    } else {
      setProducts(initialProducts);
      setLoading(false);
    }

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadProducts();
    };

    window.addEventListener("products_updated", handleUpdate);
    return () => {
      window.removeEventListener("products_updated", handleUpdate);
    };
  }, [initialProducts]);

  // گروه‌بندی خودکار محصولات بر اساس دسته‌بندی‌های ثبت‌شده در پنل ادمین
  const groupedCategories = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const prod of products) {
      const catName = String(prod.category || "سایر محصولات").trim();
      if (!map.has(catName)) {
        map.set(catName, []);
      }
      map.get(catName)!.push(prod);
    }
    return Array.from(map.entries()).map(([categoryName, items]) => ({
      categoryName,
      totalCount: items.length,
      previewItems: items.slice(0, 4), // نمایش ۴ محصول در هر ردیف
    }));
  }, [products]);

  return (
    <section
      className="py-4 space-y-10 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      {(customHeading || customSubtitle) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
          <div>
            {customHeading && (
              <h2
                className="text-xl sm:text-2xl font-black"
                suppressHydrationWarning
              >
                {customHeading}
              </h2>
            )}
            {customSubtitle && (
              <p
                className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1"
                suppressHydrationWarning
              >
                {customSubtitle}
              </p>
            )}
          </div>
          <Link
            href="/products"
            onClick={() => soundEngine.playClick()}
            className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-black text-[var(--accent-blue)] transition"
          >
            مشاهده کل کاتالوگ ({products.length.toLocaleString("fa-IR")} کالا) ←
          </Link>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4"
            >
              <div className="w-full h-44 rounded-2xl bg-[var(--input-bg)]" />
              <div className="h-4 w-3/4 bg-[var(--input-bg)] rounded-full" />
              <div className="h-3 w-1/2 bg-[var(--input-bg)] rounded-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)] space-y-2">
          <span className="text-3xl block">📦</span>
          <p>
            محصولی در پایگاه داده ثبت نشده است. از پیشخوان ادمین محصول جدید
            اضافه نمایید.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedCategories.map((group) => (
            <div key={group.categoryName} className="space-y-4">
              {/* هدر اختصاصی هر دسته‌بندی به همراه دکمه مشاهده همه */}
              <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-6 rounded-full bg-gradient-to-b from-[var(--accent-blue)] to-indigo-500" />
                  <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)]">
                    {group.categoryName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                    {group.totalCount.toLocaleString("fa-IR")} کالا
                  </span>
                </div>

                <Link
                  href={`/products?category=${encodeURIComponent(
                    group.categoryName
                  )}`}
                  onClick={() => soundEngine.playClick()}
                  className="px-3.5 py-2 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] sm:text-xs font-black text-[var(--accent-blue)] transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <span>مشاهده همه</span>
                  <span>←</span>
                </Link>
              </div>

              {/* ردیف ۴تایی محصولات هر دسته‌بندی */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {group.previewItems.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}