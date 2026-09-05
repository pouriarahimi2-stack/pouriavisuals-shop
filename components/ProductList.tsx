"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setProducts(e.detail);
      else loadProducts();
    };

    window.addEventListener("products_updated", handleUpdate);
    return () => {
      window.removeEventListener("products_updated", handleUpdate);
    };
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category || "عمومی"))).filter(Boolean);

  const filtered = products.filter((p) => {
    const isAvail = p.is_available !== false && (p.stock ?? 1) > 0;
    const matchCat = selectedCategory === "all" || (p.category || "عمومی") === selectedCategory;
    const matchSearch =
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return isAvail && matchCat && matchSearch;
  });

  return (
    <section className="py-8 space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--card-border)] pb-6">
        <div>
          <span className="text-xs font-black text-[var(--accent-blue)] block mb-1">PRO DISPLAY & GEARS</span>
          <h2 className="text-2xl md:text-3xl font-black">کاتالوگ تجهیزات تصویر و مانیتورها</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
            تمامی کالاها با گارانتی اصالت طلایی، تست سلامت فیزیکی و ارسال پیشتاز عرضه می‌شوند
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectedCategory("all");
              }}
              className={"px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap " + (selectedCategory === "all" ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")}
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
                className={"px-4 py-2 rounded-2xl font-black transition cursor-pointer whitespace-nowrap " + (selectedCategory === cat ? "bg-[var(--accent-blue)] text-white shadow-md" : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")}
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
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-secondary)]">
          کالایی در این دسته‌بندی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((prod) => {
            const displayImg = prod.images?.[0] || prod.image || "";
            return (
              <div
                key={prod.id}
                className="p-5 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl hover:border-[var(--accent-blue)] transition duration-300 flex flex-col justify-between group"
              >
                <Link href={"/products/" + prod.id} className="space-y-4 block cursor-pointer">
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

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[var(--accent-blue)] font-extrabold block">
                      {prod.category || "تجهیزات"}
                    </span>
                    <h3 className="font-extrabold text-xs text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--accent-blue)] transition">
                      {prod.title}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                      {prod.description || "دارای گارانتی اصالت طلایی و تست سلامت فیزیکی"}
                    </p>
                  </div>
                </Link>

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
                    onClick={(e) => {
                      e.preventDefault();
                      soundEngine.playAddToCart();
                      addToCart({
                        id: prod.id,
                        title: prod.title,
                        price: prod.discountPrice || prod.price,
                        image: displayImg,
                        stock: prod.stock ?? 10,
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
