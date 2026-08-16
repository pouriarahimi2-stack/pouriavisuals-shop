"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { productService, Product } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title_fa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      p.category_id === selectedCategory ||
      p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans select-none text-[var(--text-primary)]">
      
      {/* سربرگ استاندارد با رنگ کاملاً خوانا در لایت و دارک */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-xs font-black">
          کاتالوگ کامل کالاها
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
          تمامی محصولات فروشگاه
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
          تجهیزات و کالاهای اورجینال با ضمانت معتبر و ارسال سریع
        </p>
      </div>

      {/* فیلتر دسته‌بندی‌ها و باکس جستجو */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2.5 rounded-2xl font-bold transition cursor-pointer whitespace-nowrap shadow-sm ${
              selectedCategory === "all"
                ? "bg-[var(--accent-blue)] text-white shadow-lg font-black"
                : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
            }`}
          >
            همه دسته‌ها ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2.5 rounded-2xl font-bold transition cursor-pointer whitespace-nowrap shadow-sm ${
                selectedCategory === cat.name
                  ? "bg-[var(--accent-blue)] text-white shadow-lg font-black"
                  : "bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              {cat.icon ? `${cat.icon} ` : ""}{cat.name}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام کالا..."
            className="w-full px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent-blue)] shadow-sm transition"
          />
        </div>
      </div>

      {/* شبکه کارت‌ها (استفاده مستقیم از ProductCard صفحه اصلی) */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری کاتالوگ محصولات...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 max-w-md mx-auto shadow-md">
          <span className="text-4xl block">🔍</span>
          <p className="font-bold text-xs text-[var(--text-primary)]">محصولی با این مشخصات یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}