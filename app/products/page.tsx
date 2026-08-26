// app/products/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(() => productService.getAllSync());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(products.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  useEffect(() => {
    async function loadData() {
      try {
        const [prodsData, catsData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
        ]);
        setProducts(prodsData || []);
        setCategories(catsData || []);
      } catch (err) {
        console.error("Error loading products page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCategorySelect = (catName: string) => {
    soundEngine.playClick();
    setSelectedCategory(catName);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.title_fa || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      p.category === selectedCategory ||
      p.category_name === selectedCategory ||
      p.category_id === selectedCategory;

    const matchesAvail =
      !onlyAvailable ||
      (p.is_available !== false && p.isAvailable !== false && (p.stock === undefined || p.stock > 0));

    return matchesSearch && matchesCategory && matchesAvail;
  });

  filtered.sort((a, b) => {
    const priceA = Number(a.discountPrice || a.discount_price || a.price || 0);
    const priceB = Number(b.discountPrice || b.discount_price || b.price || 0);

    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">کاتالوگ تجهیزات دیجیتال، تصویر و استودیو</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto font-medium">
          بررسی تخصصی و خرید انواع مانیتورهای تدوین، کالیبراتورهای رنگ، کارت‌های کپچر با ضمانت اصالت
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => handleCategorySelect("all")}
              className={`px-4 py-2.5 rounded-2xl font-bold cursor-pointer transition whitespace-nowrap ${
                selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              همه کالاها ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id || cat.name}
                onClick={() => handleCategorySelect(cat.name)}
                className={`px-4 py-2.5 rounded-2xl font-bold cursor-pointer transition whitespace-nowrap ${
                  selectedCategory === cat.name ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 جستجو در نام، مدل یا مشخصات..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--card-border)] text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onlyAvailCheckbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded-lg cursor-pointer"
            />
            <label htmlFor="onlyAvailCheckbox" className="font-bold cursor-pointer">
              فقط کالاهای موجود در انبار
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-bold">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
            >
              <option value="newest">جدیدترین محصولات</option>
              <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
              <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
            </select>
          </div>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)]">
          کالایی مطابق با جستجوی شما یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}