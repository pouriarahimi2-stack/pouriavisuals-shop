// File Path: components/ProductList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import ProductCard from "@/components/ProductCard";

export interface ProductListProps {
  initialProducts?: Product[];
}

export default function ProductList({ initialProducts }: ProductListProps = {}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0);

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

  return (
    <section className="py-8 space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="border-b border-[var(--card-border)] pb-5 text-right">
        <h2 className="text-2xl sm:text-3xl font-black">کاتالوگ تجهیزات و محصولات</h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
          تمامی کالاها با گارانتی اصالت طلایی، تست سلامت فیزیکی و ارسال پیشتاز عرضه می‌شوند
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-5 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-4">
              <div className="w-full h-48 rounded-3xl bg-[var(--input-bg)]" />
              <div className="h-4 w-3/4 bg-[var(--input-bg)] rounded-full" />
              <div className="h-3 w-1/2 bg-[var(--input-bg)] rounded-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)] space-y-2">
          <span className="text-3xl block">📦</span>
          <p>محصولی در پایگاه داده ثبت نشده است. از پیشخوان ادمین محصول جدید اضافه نمایید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </section>
  );
}
