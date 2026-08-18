"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { orderService, Order } from "@/services/orderService";
import Link from "next/link";

export default function AdminGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      async function loadSearchData() {
        try {
          const [prods, ords] = await Promise.all([
            productService.getAll(),
            orderService.getAll(),
          ]);
          setProducts(prods || []);
          setOrders(ords || []);

          const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
          setBlogs(localBlogs);
        } catch (e) {
          console.error("Global search data load error:", e);
        }
      }
      loadSearchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const matchedProducts = cleanQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          (p.category || "").toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedOrders = cleanQuery
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(cleanQuery) ||
          o.customerName.toLowerCase().includes(cleanQuery) ||
          o.phone.includes(cleanQuery) ||
          (o.trackingCode && o.trackingCode.includes(cleanQuery))
      )
    : [];

  const matchedBlogs = cleanQuery
    ? blogs.filter(
        (b) =>
          (b.title || "").toLowerCase().includes(cleanQuery) ||
          (b.content || "").toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = matchedProducts.length + matchedOrders.length + matchedBlogs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans select-none" dir="rtl">
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* اینپوت جستجو */}
        <div className="p-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در نام کالاها، شماره سفارش‌ها، مشتریان و مقالات وبلاگ..."
            className="flex-1 bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
          />
          <span className="px-2 py-1 rounded-lg bg-[var(--input-bg)] text-[10px] font-mono font-bold text-[var(--text-secondary)] border border-[var(--card-border)]">
            ESC
          </span>
        </div>

        {/* لیست نتایج */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {!cleanQuery ? (
            <div className="py-12 text-center text-[var(--text-secondary)] space-y-1 font-medium">
              <p className="font-bold">جستجوی بلادرنگ در سراسر فروشگاه</p>
              <p className="text-[11px]">عبارت مورد نظر خود را تایپ نمایید.</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-[var(--text-secondary)] font-bold">
              موردی مطابق با جستجوی شما یافت نشد.
            </div>
          ) : (
            <>
              {/* بخش محصولات */}
              {matchedProducts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-[var(--accent-blue)] block">
                    📦 محصولات ({matchedProducts.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedProducts.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 hover:border-[var(--accent-blue)] transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.images?.[0] || p.image || ""}
                            alt=""
                            className="w-8 h-8 rounded-lg object-contain bg-[var(--modal-bg)] p-0.5"
                          />
                          <span className="font-bold text-[var(--text-primary)]">{p.name}</span>
                        </div>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {(p.price || 0).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* بخش سفارش‌ها */}
              {matchedOrders.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 block">
                    📑 سفارش‌ها ({matchedOrders.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedOrders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 hover:border-purple-500 transition"
                      >
                        <div>
                          <span className="font-mono font-black text-[var(--accent-blue)] block">{o.id}</span>
                          <span className="text-[11px] text-[var(--text-secondary)] font-medium">خریدار: {o.customerName} ({o.phone})</span>
                        </div>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {(o.totalAmount || 0).toLocaleString("fa-IR")} ت
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* بخش مقالات */}
              {matchedBlogs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-amber-500 block">
                    📚 مقالات وبلاگ ({matchedBlogs.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedBlogs.slice(0, 4).map((b) => (
                      <Link
                        key={b.id}
                        href={`/blog/${b.id}`}
                        onClick={() => setIsOpen(false)}
                        className="block p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-amber-500 transition"
                      >
                        <h5 className="font-bold text-[var(--text-primary)]">{b.title || "مقاله بدون عنوان"}</h5>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono">📅 {b.createdAt || "امروز"}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* فوتر مودال */}
        <div className="p-3 border-t border-[var(--card-border)] bg-[var(--input-bg)] flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-bold">
          <span>تعداد نتایج: {totalResults}</span>
          <span>میانبر دسترسی سریع: Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}