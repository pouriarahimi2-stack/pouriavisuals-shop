"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Check, RotateCcw, Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // فیلترهای چندبعدی
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "discount">("newest");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

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
      } catch {} finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "سایر";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const title = (p.title || p.name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch = !search || title.includes(search) || cat.includes(search) || desc.includes(search);
        const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
        const matchesStock = !onlyAvailable || (p.stock && p.stock > 0);
        
        const hasDiscount = Boolean(p.discount_price || p.discountPrice);
        const matchesDiscount = !onlyDiscounted || hasDiscount;

        const effectivePrice = Number(p.discount_price || p.discountPrice || p.price || 0);
        const matchesMinPrice = minPrice === "" || effectivePrice >= Number(minPrice);
        const matchesMaxPrice = maxPrice === "" || effectivePrice <= Number(maxPrice);

        return matchesSearch && matchesCat && matchesStock && matchesDiscount && matchesMinPrice && matchesMaxPrice;
      })
      .sort((a, b) => {
        const priceA = Number(a.discount_price || a.discountPrice || a.price || 0);
        const priceB = Number(b.discount_price || b.discountPrice || b.price || 0);

        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "discount") {
          const discA = a.discount_price ? Number(a.price) - Number(a.discount_price) : 0;
          const discB = b.discount_price ? Number(b.price) - Number(b.discount_price) : 0;
          return discB - discA;
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [products, searchTerm, selectedCategory, onlyAvailable, onlyDiscounted, minPrice, maxPrice, sortBy]);

  const resetAllFilters = () => {
    soundEngine.playClick();
    setSearchTerm("");
    setSelectedCategory("all");
    setOnlyAvailable(false);
    setOnlyDiscounted(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedCategory !== "all" || onlyAvailable || onlyDiscounted || minPrice !== "" || maxPrice !== "" || sortBy !== "newest"
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6 font-bold">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">کاتالوگ رسمی کالاها</span>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* هدر تمیز و بدون متن اضافه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black">کاتالوگ کالاها و تجهیزات هوشمند</h1>
            <span className="text-xs text-[var(--text-secondary)] font-bold mt-1 block">
              نمایش {filteredProducts.length} محصول از مجموع {products.length} کالا
            </span>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام کالا، برند یا مشخصه..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] font-bold shadow-sm"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* پنل فیلتراسیون پیشرفته و چندبعدی */}
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-4 text-xs">
          
          {/* دسته‌بندی‌ها */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] block">دسته‌بندی محصول:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { soundEngine.playClick(); setSelectedCategory("all"); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow" : "bg-[var(--input-bg)] text-[var(--text-secondary)]"
                }`}
              >
                همه کالاها ({products.length})
              </button>
              {Object.entries(categories).map(([catName, count]) => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => { soundEngine.playClick(); setSelectedCategory(catName); }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    selectedCategory === catName ? "bg-[var(--accent-blue)] text-white shadow" : "bg-[var(--input-bg)] text-[var(--text-secondary)]"
                  }`}
                >
                  {catName} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* فیلترهای تکمیلی و بازه قیمت */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[var(--card-border)] items-center">
            
            {/* چک‌باکس‌های وضعیت موجودی و تخفیف */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { soundEngine.playClick(); setOnlyAvailable(!onlyAvailable); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  onlyAvailable ? "bg-emerald-600 text-white shadow" : "bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"
                }`}
              >
                <Check size={14} className={onlyAvailable ? "opacity-100" : "opacity-40"} />
                فقط کالاهای موجود
              </button>

              <button
                type="button"
                onClick={() => { soundEngine.playClick(); setOnlyDiscounted(!onlyDiscounted); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  onlyDiscounted ? "bg-rose-600 text-white shadow" : "bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"
                }`}
              >
                <Check size={14} className={onlyDiscounted ? "opacity-100" : "opacity-40"} />
                فقط تخفیف‌دارها
              </button>
            </div>

            {/* تعیین بازه حداقل و حداکثر قیمت */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="از قیمت (تومان)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-1/2 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center text-xs outline-none focus:border-[var(--accent-blue)]"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="number"
                placeholder="تا قیمت (تومان)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-1/2 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-center text-xs outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            {/* مرتب‌سازی و ریست */}
            <div className="flex items-center justify-end gap-2">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-xs font-bold cursor-pointer outline-none text-[var(--text-primary)]"
              >
                <option value="newest">جدیدترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="discount">بیشترین تخفیف</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="p-2 px-3 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition flex items-center gap-1 cursor-pointer"
                  title="پاکسازی فیلترها"
                >
                  <RotateCcw size={13} />
                  <span>حذف فیلترها</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* گرید کالاها */}
        <div>
          {loading ? (
            <div className="text-center py-24 text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری کاتالوگ...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center text-xs font-bold text-[var(--text-secondary)] space-y-2">
              <span className="text-3xl block">🔍</span>
              <p>کالایی مطابق با فیلترهای انتخابی شما یافت نشد.</p>
              <button onClick={resetAllFilters} className="text-[var(--accent-blue)] hover:underline font-bold mt-2">
                مشاهده مجدد همه محصولات
              </button>
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
