"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminInventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    const data = await productService.getAll();
    setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("inventory-realtime-channel-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStockChange = async (id: string, newStock: number) => {
    soundEngine.playClick();
    const stockVal = Math.max(0, newStock);
    setUpdatingId(id);
    if (supabase) {
      await supabase.from("products").update({ stock: stockVal, is_available: stockVal > 0 }).eq("id", id);
    }
    setProducts(products.map((p) => (p.id === id ? { ...p, stock: stockVal, is_available: stockVal > 0 } : p)));
    setUpdatingId(null);
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    soundEngine.playClick();
    setUpdatingId(id);
    if (supabase) {
      await supabase.from("products").update({ is_available: !current }).eq("id", id);
    }
    setProducts(products.map((p) => (p.id === id ? { ...p, is_available: !current, isAvailable: !current } : p)));
    setUpdatingId(null);
  };

  const filtered = products.filter(
    (p) =>
      (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📥</span> مدیریت سریع موجودی انبار و وضعیت عرضه
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            افزایش/کاهش سریع تعداد موجودی، رصد کالاهای در معرض اتمام و تغییر زنده وضعیت عرضه
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 جستجو در نام کالا یا دسته..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
              <th className="p-3">تصویر</th>
              <th className="p-3">نام محصول</th>
              <th className="p-3">دسته‌بندی</th>
              <th className="p-3">قیمت فعلی</th>
              <th className="p-3 text-center">موجودی انبار</th>
              <th className="p-3 text-center">وضعیت عرضه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)] font-medium">
            {filtered.map((p) => {
              const currentStock = p.stock ?? 0;
              const isCritical = currentStock < 3;

              return (
                <tr key={p.id} className="hover:bg-[var(--input-bg)]/50 transition">
                  <td className="p-3">
                    <img
                      src={p.images?.[0] || p.image || "/placeholder.png"}
                      alt=""
                      className="w-11 h-11 object-contain rounded-xl bg-white/5 p-1 border border-[var(--card-border)]"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-extrabold text-[var(--text-primary)]">{p.title || p.name}</div>
                    {isCritical && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                        ⚠️ موجودی بحرانی ({currentStock} عدد)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[var(--text-secondary)] font-medium">{p.category || "عمومی"}</td>
                  <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {Number(p.discountPrice || p.price || 0).toLocaleString("fa-IR")} ت
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleStockChange(p.id, currentStock - 1)}
                        className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black hover:border-[var(--accent-blue)] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-mono font-black text-sm text-[var(--text-primary)]">
                        {currentStock}
                      </span>
                      <button
                        onClick={() => handleStockChange(p.id, currentStock + 1)}
                        className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black hover:border-[var(--accent-blue)] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleAvailability(p.id, p.is_available !== false)}
                      disabled={updatingId === p.id}
                      className={`px-4 py-2 rounded-2xl font-black text-xs transition cursor-pointer ${
                        p.is_available !== false && currentStock > 0
                          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                          : "bg-rose-500/15 text-rose-600 border border-rose-500/30 hover:bg-rose-500 hover:text-white"
                      }`}
                    >
                      {p.is_available !== false && currentStock > 0 ? "موجود در انبار ✓" : "ناموجود ✕"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}