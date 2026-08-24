"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";

export default function AdminInventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    const data = await productService.getAll();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();

    // همگام‌سازی لحظه‌ای انبارداری
    const channel = supabase
      .channel("inventory-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStockChange = async (id: string, newStock: number) => {
    setUpdatingId(id);
    await supabase.from("products").update({ stock: Math.max(0, newStock) }).eq("id", id);
    setProducts(products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock) } : p)));
    setUpdatingId(null);
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    setUpdatingId(id);
    await supabase.from("products").update({ is_available: !current }).eq("id", id);
    setProducts(products.map((p) => (p.id === id ? { ...p, is_available: !current, isAvailable: !current } : p)));
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">📊 مدیریت سریع انبار و موجودی کالاها</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">ویرایش سریع تعداد موجودی و وضعیت موجود/ناموجود بدون نیاز به ویرایش کامل</p>
        </div>
      </div>

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
              <th className="p-3">تصویر</th>
              <th className="p-3">نام کالا</th>
              <th className="p-3">دسته‌بندی</th>
              <th className="p-3">قیمت فعلی</th>
              <th className="p-3">تعداد موجودی</th>
              <th className="p-3">وضعیت عرضه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--input-bg)]/50 transition">
                <td className="p-3">
                  <img
                    src={p.images?.[0] || p.image || "/placeholder.png"}
                    alt=""
                    className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1 border border-[var(--card-border)]"
                  />
                </td>
                <td className="p-3 font-extrabold text-[var(--text-primary)]">{p.title || p.name}</td>
                <td className="p-3 text-[var(--text-secondary)]">{p.category}</td>
                <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {Number(p.discountPrice || p.price).toLocaleString("fa-IR")} ت
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStockChange(p.id, (p.stock || 0) - 1)}
                      className="w-7 h-7 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-black hover:border-[var(--accent-blue)] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-black text-sm">{p.stock ?? 0}</span>
                    <button
                      onClick={() => handleStockChange(p.id, (p.stock || 0) + 1)}
                      className="w-7 h-7 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-black hover:border-[var(--accent-blue)] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleAvailability(p.id, p.is_available !== false)}
                    disabled={updatingId === p.id}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      p.is_available !== false
                        ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                    }`}
                  >
                    {p.is_available !== false ? "موجود ✓" : "ناموجود ✕"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}