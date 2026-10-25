"use client";

import React, { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { soundEngine } from "@/lib/soundEngine";
import FacetedFilterSidebar from "@/components/FacetedFilterSidebar";

interface ProductItem {
  id: string | number;
  title: string;
  name?: string;
  price: number;
  discount_price?: number;
  discountPrice?: number;
  image?: string;
  images?: string[];
  category?: string;
  stock?: number;
  is_available?: boolean;
  brand?: string;
  specs_jsonb?: any;
}

export default function ProductArchiveClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductItem[];
  categories: string[];
}) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "price_asc" | "price_desc">("default");
  
  // استیت فیلترهای سایدبار پیشرفته
  const [advancedFilters, setAdvancedFilters] = useState<any>({ categories: [], brands: [], minPrice: 0, maxPrice: 100000000 });

  // محاسبه خودکار فیلترها از لیست کالاها
  const computedCategories = Array.from(new Set(initialProducts.map(p => p.category).filter(Boolean))) as string[];
  const computedBrands = Array.from(new Set(initialProducts.map(p => p.brand || (p.specs_jsonb && p.specs_jsonb.brand)).filter(Boolean))) as string[];
  const computedMaxPrice = initialProducts.length > 0 ? Math.max(...initialProducts.map(p => p.price || 0)) : 100000000;

  const filtered = initialProducts
    .filter((p) => {
      // فیلترهای پایه (بالای صفحه)
      const matchCat = selectedCat === "all" || p.category === selectedCat;
      const matchSearch =
        (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase());
        
      // فیلترهای پیشرفته (سایدبار)
      const matchAdvCat = advancedFilters.categories.length === 0 || (p.category && advancedFilters.categories.includes(p.category));
      const pBrand = p.brand || (p.specs_jsonb && p.specs_jsonb.brand);
      const matchAdvBrand = advancedFilters.brands.length === 0 || (pBrand && advancedFilters.brands.includes(pBrand));
      const matchPrice = (p.price || 0) <= (advancedFilters.maxPrice || 100000000);
      
      return matchCat && matchSearch && matchAdvCat && matchAdvBrand && matchPrice;
    })
    .sort((a, b) => {
      const priceA = a.discount_price || a.discountPrice || a.price;
      const priceB = b.discount_price || b.discountPrice || b.price;
      if (sortOrder === "price_asc") return priceA - priceB;
      if (sortOrder === "price_desc") return priceB - priceA;
      return 0;
    });

  return (
    <div className="space-y-8">
      {/* هدر جستجو و فیلترهای سریع */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCat === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            همه کالاها ({initialProducts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(c);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                selectedCat === c
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در کالاها..."
            className="flex-1 md:w-60 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
          <select
            value={sortOrder}
            onChange={(e) => {
              soundEngine.playClick();
              setSortOrder(e.target.value as any);
            }}
            className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] cursor-pointer outline-none"
          >
            <option value="default">پیش‌فرض</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>
      </div>
      
      {/* گرید اصلی و سایدبار فیلترها */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* سایدبار (دسکتاپ) */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <FacetedFilterSidebar 
            categories={computedCategories} 
            brands={computedBrands} 
            maxPrice={computedMaxPrice} 
            onFilterChange={setAdvancedFilters} 
          />
        </aside>

        {/* لیست کالاها */}
        <div className="flex-1 w-full">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)]">
              کالایی با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
