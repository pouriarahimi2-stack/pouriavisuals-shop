// components/ProductList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const handleUpdate = (e: any) => {
      if (e.detail) setProducts(e.detail);
      else loadProducts();
    };

    const handleCategorySelect = (e: any) => {
      if (e.detail) setSelectedCategory(e.detail);
    };

    window.addEventListener("products_updated", handleUpdate);
    window.addEventListener("category_selected", handleCategorySelect);

    return () => {
      window.removeEventListener("products_updated", handleUpdate);
      window.removeEventListener("category_selected", handleCategorySelect);
    };
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category || "عمومی"))).filter(Boolean);

  const filtered = products.filter((p) => {
    const isAvail = p.is_available !== false && (p.stock ?? 1) > 0;
    const matchCat = selectedCategory === "all" || (p.category || "عمومی") === selectedCategory;
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return isAvail && matchCat && matchSearch;
  });

  return (
    <section id="products" className="py-12 space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر بخش محصولات */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--card-border)] pb-6">
        <div>
          <span className="text-xs font-black text-[var(--accent-blue)] block mb-1">PRO DISPLAY & GEARS</span>
          <h2 className="text-2xl md:text-3xl font-black">کاتالوگ تجهیزات تصویر و مانیتورها</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
            تمامی کالاها با گارانتی اصالت، تست سلامت و ارسال پیشتاز عرضه می‌شوند
          </p>
        </div>

        {/* فیلترها و جستجو */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedCategory("all");
              }}
              className={`px-4 py-2 rounded-2xl font-black transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[var(--accent-blue)] text-white shadow-md"
                  : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
              }`}
            >
              همه ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-4 py-2 rounded-2xl font-black transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[var(--accent-blue)] text-white shadow-md"
                    : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجو در مدل یا مشخصات..."
            className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] w-full md:w-56"
          />
        </div>
      </div>

      {/* گرید محصولات */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-full h-48 rounded-3xl bg-[var(--input-bg)] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-slate-200/60 dark:bg-slate-800/60 rounded-full" />
                  <div className="h-4 w-3/4 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
                  <div className="h-3 w-5/6 bg-slate-200/40 dark:bg-slate-800/40 rounded-full" />
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--card-border)] space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-12 bg-slate-200/40 dark:bg-slate-800/40 rounded-full" />
                  <div className="h-5 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
                </div>
                <div className="h-10 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)] shadow-xl">
          کالایی در این دسته‌بندی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((prod) => {
            const displayImg = prod.images?.[0] || prod.image || "";
            return (
              <div
                key={prod.id}
                className="p-5 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl hover:border-[var(--accent-blue)] hover:shadow-2xl transition duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* تصویر محصول */}
                  <div className="w-full h-48 rounded-3xl bg-[var(--input-bg)] p-3 border border-[var(--card-border)] flex items-center justify-center relative overflow-hidden">
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={prod.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-3xl opacity-40">🖼️</span>
                    )}

                    {prod.is_featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] shadow-lg">
                        🔥 پیشنهاد ویژه
                      </span>
                    )}
                  </div>

                  {/* مشخصات */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[var(--accent-blue)] font-extrabold block">
                      {prod.category || "تجهیزات"}
                    </span>
                    <h3 className="font-extrabold text-xs text-[var(--text-primary)] line-clamp-2 leading-snug">
                      {prod.title}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                      {prod.description || "دارای گارانتی اصالت و ضمانت بازگشت وجه ۷ روزه"}
                    </p>
                  </div>
                </div>

                {/* قیمت و دکمه خرید */}
                <div className="pt-4 border-t border-[var(--card-border)] space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold">قیمت نهایی:</span>
                    <div className="text-left">
                      {prod.discountPrice && prod.discountPrice < prod.price && (
                        <span className="block text-[10px] text-[var(--text-secondary)] line-through font-mono">
                          {prod.price.toLocaleString("fa-IR")}
                        </span>
                      )}
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {Number(prod.discountPrice || prod.price || 0).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playAddToCart();
                      addToCart({
                        id: prod.id,
                        title: prod.title,
                        price: prod.discountPrice || prod.price,
                        image: displayImg,
                      });
                    }}
                    className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🛒</span>
                    <span>افزودن به سبد خرید</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}