"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Check, ShoppingCart, ArrowLeft, Eye } from "lucide-react";

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
        if (data.success && Array.isArray(data.products)) {
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
        const priceA = Number(a.discount_price || a.price || 0);
        const priceB = Number(b.discount_price || b.price || 0);
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [products, searchTerm, onlyAvailable, sortBy]);

  const addToCart = (product: any) => {
    try {
      const current = JSON.parse(localStorage.getItem("axon_cart") || "[]");
      const idx = current.findIndex((i: any) => i.id === product.id);
      if (idx > -1) {
        current[idx].quantity = (current[idx].quantity || 1) + 1;
      } else {
        current.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("axon_cart", JSON.stringify(current));
      window.dispatchEvent(new Event("cart_updated"));
      window.dispatchEvent(new Event("open_cart_drawer"));
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 dir-rtl">
      {/* بردکرامب */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6">
        <Link href="/" className="hover:underline">خانه</Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">کاتالوگ کالاها</span>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--card-border)]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">کاتالوگ رسمی کالاها</h1>
            <p className="text-xs text-zinc-400 mt-1">تضمین سلامت فیزیکی و اصالت تمامی اقلام با قیمت رسمی به تومان</p>
          </div>

          {/* ابزار جستجو */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام کالا یا دسته..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-white outline-none focus:border-[#0071e3]"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        {/* فیلترها و مرتب‌سازی در موبایل، تبلت و دسکتاپ */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] p-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                onlyAvailable ? "bg-emerald-500 text-black" : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              <Check size={14} className={onlyAvailable ? "opacity-100" : "opacity-40"} />
              فقط کالاهای موجود
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 hidden sm:inline font-bold">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none"
            >
              <option value="newest">جدیدترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
            </select>
          </div>
        </div>

        {/* کارت‌های محصولات */}
        <div className="mt-8">
          {loading ? (
            <div className="text-center py-24 text-xs font-bold text-zinc-400">
              در حال بارگذاری کاتالوگ کالاها...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center text-xs text-zinc-400 font-bold">
              کالایی با مشخصات جستجو شده یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-4 flex flex-col justify-between hover:border-[#0071e3]/50 transition shadow-sm"
                  >
                    <div>
                      {/* تصویر کالا */}
                      <Link href={`/products/${p.id}`} className="block relative aspect-square rounded-2xl overflow-hidden bg-black/20 mb-4">
                        {p.images && p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                            تصویر کالا
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30">
                              ناموجود
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="text-[11px] text-[#0071e3] font-bold mb-1">{p.category || "کالای هوشمند"}</div>
                      <Link href={`/products/${p.id}`} className="font-black text-xs sm:text-sm text-white hover:text-[#0071e3] transition line-clamp-2">
                        {p.title}
                      </Link>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-zinc-400">قیمت:</span>
                        <div className="text-left">
                          {p.discount_price ? (
                            <>
                              <div className="text-[10px] text-zinc-500 line-through">
                                {Number(p.price).toLocaleString("fa-IR")}
                              </div>
                              <div className="text-sm font-black text-emerald-400">
                                {Number(p.discount_price).toLocaleString("fa-IR")} تومان
                              </div>
                            </>
                          ) : (
                            <div className="text-sm font-black text-emerald-400">
                              {Number(p.price || 0).toLocaleString("fa-IR")} تومان
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/products/${p.id}`}
                          className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Eye size={13} />
                          جزئیات
                        </Link>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p)}
                          className="py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition disabled:opacity-40"
                        >
                          <ShoppingCart size={13} />
                          خرید
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
