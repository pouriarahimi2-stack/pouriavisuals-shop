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
  
  // Ø§Ø³ØªÛŒØª ÙÛŒÙ„ØªØ±Ù‡Ø§ÛŒ Ø³Ø§ÛŒØ¯Ø¨Ø§Ø± Ù¾ÛŒØ´Ø±ÙØªÙ‡
  const [advancedFilters, setAdvancedFilters] = useState<any>({ categories: [], brands: [], minPrice: 0, maxPrice: 100000000 });

  // Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø®ÙˆØ¯Ú©Ø§Ø± ÙÛŒÙ„ØªØ±Ù‡Ø§ Ø§Ø² Ù„ÛŒØ³Øª Ú©Ø§Ù„Ø§Ù‡Ø§
  const computedCategories = Array.from(new Set(initialProducts.map(p => p.category).filter(Boolean))) as string[];
  const computedBrands = Array.from(new Set(initialProducts.map(p => p.brand || (p.specs_jsonb && p.specs_jsonb.brand)).filter(Boolean))) as string[];
  const computedMaxPrice = initialProducts.length > 0 ? Math.max(...initialProducts.map(p => p.price || 0)) : 100000000;

  const filtered = initialProducts
    .filter((p) => {
      // ÙÛŒÙ„ØªØ±Ù‡Ø§ÛŒ Ù¾Ø§ÛŒÙ‡ (Ø¨Ø§Ù„Ø§ÛŒ ØµÙØ­Ù‡)
      const matchCat = selectedCat === "all" || p.category === selectedCat;
      const matchSearch =
        (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase());
        
      // ÙÛŒÙ„ØªØ±Ù‡Ø§ÛŒ Ù¾ÛŒØ´Ø±ÙØªÙ‡ (Ø³Ø§ÛŒØ¯Ø¨Ø§Ø±)
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
      {/* Ù‡Ø¯Ø± Ø¬Ø³ØªØ¬Ùˆ Ùˆ ÙÛŒÙ„ØªØ±Ù‡Ø§ÛŒ Ø³Ø±ÛŒØ¹ */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap py-2 no-scrollbar w-full md:w-auto shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              setSelectedCat("all");
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
              selectedCat === "all"
                ? "bg-sky-500/90 text-white shadow-[0_8px_16px_rgba(14,165,233,0.3)] rounded-full backdrop-blur-md border border-sky-400"
                : "bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-full backdrop-blur-md hover:bg-white/80"
            }`}
          >
            Ù‡Ù…Ù‡ Ú©Ø§Ù„Ø§Ù‡Ø§ ({initialProducts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCat(c);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCat === c
                  ? "bg-sky-500/90 text-white shadow-[0_8px_16px_rgba(14,165,233,0.3)] rounded-full backdrop-blur-md border border-sky-400"
                  : "bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-full backdrop-blur-md hover:bg-white/80"
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
            placeholder="ðŸ” Ø¬Ø³ØªØ¬Ùˆ Ø¯Ø± Ú©Ø§Ù„Ø§Ù‡Ø§..."
            className="flex-1 md:w-60 p-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
          />
          <select
            value={sortOrder}
            onChange={(e) => {
              soundEngine.playClick();
              setSortOrder(e.target.value as any);
            }}
            className="p-2.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] cursor-pointer outline-none"
          >
            <option value="default">Ù¾ÛŒØ´â€ŒÙØ±Ø¶</option>
            <option value="price_asc">Ø§Ø±Ø²Ø§Ù†â€ŒØªØ±ÛŒÙ†</option>
            <option value="price_desc">Ú¯Ø±Ø§Ù†â€ŒØªØ±ÛŒÙ†</option>
          </select>
        </div>
      </div>
      
      {/* Ú¯Ø±ÛŒØ¯ Ø§ØµÙ„ÛŒ Ùˆ Ø³Ø§ÛŒØ¯Ø¨Ø§Ø± ÙÛŒÙ„ØªØ±Ù‡Ø§ */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Ø³Ø§ÛŒØ¯Ø¨Ø§Ø± (Ø¯Ø³Ú©ØªØ§Ù¾) */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <FacetedFilterSidebar 
            categories={computedCategories} 
            brands={computedBrands} 
            maxPrice={computedMaxPrice} 
            onFilterChange={setAdvancedFilters} 
          />
        </aside>

        {/* Ù„ÛŒØ³Øª Ú©Ø§Ù„Ø§Ù‡Ø§ */}
        <div className="flex-1 w-full">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl text-xs font-bold text-[var(--text-secondary)]">
              Ú©Ø§Ù„Ø§ÛŒÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ù…Ø´Ø®ØµØ§Øª ÛŒØ§ÙØª Ù†Ø´Ø¯.
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
