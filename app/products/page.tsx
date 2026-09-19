"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Check, ShoppingCart, Eye } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          !searchTerm ||
          p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = !onlyAvailable || (p.stock && p.stock > 0);
        return matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        const priceA = Number(a.discount_price || a.discountPrice || a.price || 0);
        const priceB = Number(b.discount_price || b.discountPrice || b.price || 0);
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [products, searchTerm, onlyAvailable, sortBy]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">کاتالوگ کالاها</span>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black">کاتالوگ رسمی کالاها و تجهیزات</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">تضمین سلامت فیزیکی و اصالت تمامی اقلام با قیمت رسمی به تومان</p>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام کالا یا دسته..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] font-bold"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                onlyAvailable ? "bg-emerald-500 text-white shadow" : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
              }`}
            >
              <Check size={14} className={onlyAvailable ? "opacity-100" : "opacity-40"} />
              فقط کالاهای موجود
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-secondary)] hidden sm:inline font-bold">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer outline-none"
            >
              <option value="newest">جدیدترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
            </select>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="text-center py-24 text-xs font-bold text-[var(--text-secondary)]">
              در حال بارگذاری کاتالوگ کالاها...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center text-xs font-bold text-[var(--text-secondary)]">
              کالایی با مشخصات جستجو شده یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
