// File Path: components/ProductArchiveClient.tsx
"use client";

import React, { useState, useMemo } from "react";
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
  const [sortOrder, setSortOrder] = useState<
    "default" | "price_asc" | "price_desc"
  >("default");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // استیت فیلترهای سایدبار پیشرفته
  const [advancedFilters, setAdvancedFilters] = useState<{
    categories: string[];
    brands: string[];
    minPrice: number;
    maxPrice: number;
  }>({
    categories: [],
    brands: [],
    minPrice: 0,
    maxPrice: 1000000000,
  });

  // محاسبه خودکار فیلترها از لیست کالاها
  const computedCategories = useMemo(
    () =>
      Array.from(
        new Set(initialProducts.map((p) => p.category).filter(Boolean))
      ) as string[],
    [initialProducts]
  );

  const computedBrands = useMemo(
    () =>
      Array.from(
        new Set(
          initialProducts
            .map((p) => p.brand || (p.specs_jsonb && p.specs_jsonb.brand))
            .filter(Boolean)
        )
      ) as string[],
    [initialProducts]
  );

  const computedMaxPrice = useMemo(
    () =>
      initialProducts.length > 0
        ? Math.max(...initialProducts.map((p) => Number(p.price || 0)))
        : 100000000,
    [initialProducts]
  );

  const filtered = initialProducts
    .filter((p) => {
      // فیلترهای پایه (بالای صفحه)
      const matchCat = selectedCat === "all" || p.category === selectedCat;
      const matchSearch =
        (p.title || p.name || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase());

      // فیلترهای پیشرفته (سایدبار)
      const matchAdvCat =
        advancedFilters.categories.length === 0 ||
        (p.category && advancedFilters.categories.includes(p.category));
      const pBrand = p.brand || (p.specs_jsonb && p.specs_jsonb.brand);
      const matchAdvBrand =
        advancedFilters.brands.length === 0 ||
        (pBrand && advancedFilters.brands.includes(pBrand));

      const effectivePrice = Number(
        p.discount_price || p.discountPrice || p.price || 0
      );
      const matchPrice =
        effectivePrice >= (advancedFilters.minPrice || 0) &&
        effectivePrice <= (advancedFilters.maxPrice || 1000000000);

      return (
        matchCat && matchSearch && matchAdvCat && matchAdvBrand && matchPrice
      );
    })
    .sort((a, b) => {
      const priceA = Number(
        a.discount_price || a.discountPrice || a.price || 0
      );
      const priceB = Number(
        b.discount_price || b.discountPrice || b.price || 0
      );
      if (sortOrder === "price_asc") return priceA - priceB;
      if (sortOrder === "price_desc") return priceB - priceA;
      return 0;
    });

  return (
    <div className="space-y-8 font-sans select-text" dir="rtl">
      {/* هدر جستجو و فیلترهای سریع */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap py-2 no-scrollbar w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
              selectedCat === "all"
                ? "bg-sky-500/90 text-white shadow-[0_8px_16px_rgba(14,165,233,0.3)] backdrop-blur-md border border-sky-400"
                : "bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 backdrop-blur-md hover:bg-white/80"
            }`}
          >
            همه کالاها ({initialProducts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(c);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCat === c
                  ? "bg-sky-500/90 text-white shadow-[0_8px_16px_rgba(14,165,233,0.3)] backdrop-blur-md border border-sky-400"
                  : "bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 backdrop-blur-md hover:bg-white/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setMobileFiltersOpen(!mobileFiltersOpen);
            }}
            className="md:hidden px-3.5 py-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black text-[var(--accent-blue)] shrink-0 cursor-pointer"
          >
            🎛️ فیلترها
          </button>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در کالاها..."
            className="flex-1 md:w-60 p-2.5 px-4 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
          <select
            value={sortOrder}
            onChange={(e) => {
              soundEngine.playClick();
              setSortOrder(e.target.value as any);
            }}
            className="p-2.5 px-3 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] cursor-pointer outline-none"
          >
            <option value="default">پیش‌فرض</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>
      </div>

      {/* پنل فیلترهای پیشرفته در موبایل */}
      {mobileFiltersOpen && (
        <div className="md:hidden">
          <FacetedFilterSidebar
            categories={computedCategories}
            brands={computedBrands}
            maxPrice={computedMaxPrice}
            onFilterChange={setAdvancedFilters}
          />
        </div>
      )}

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