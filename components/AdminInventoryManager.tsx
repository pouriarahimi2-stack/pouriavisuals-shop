"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
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
    const handleProductsUpdate = () => fetchProducts();
    window.addEventListener("products_updated", handleProductsUpdate);
    return () => window.removeEventListener("products_updated", handleProductsUpdate);
  }, []);

  const handleStockChange = async (id: string, newStock: number, title: string) => {
    soundEngine.playClick();
    const stockVal = Math.max(0, newStock);
    setUpdatingId(id);
    await productService.saveProduct({ id, stock: stockVal, isAvailable: stockVal > 0, is_available: stockVal > 0 });
    setProducts(products.map((p) => (p.id === id ? { ...p, stock: stockVal, is_available: stockVal > 0, isAvailable: stockVal > 0 } : p)));

    // ارسال خودکار پیامک هشدار به مدیر در صورت رسیدن به موجودی بحرانی
    if (stockVal <= 2) {
      try {
        await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "09123456789",
            message: "هشدار آکسون: موجودی کالای «" + title + "» به " + stockVal + " عدد رسید. لطفاً انبار را شارژ فرمایید.",
          }),
        });
      } catch (err) {
        console.warn("SMS alert warning:", err);
      }
    }
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
            <span>📥</span> مدیریت سریع موجودی انبار و اعلان خودکار
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تغییر تعداد، رصد کالاهای بحرانی (&lt; ۳ عدد) و ارسال خودکار پیامک هشدار کسری انبار
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
        <table className="w-full text-right text-xs border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3">
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
                        onClick={() => handleStockChange(p.id, currentStock - 1, p.title || p.name || "کالا")}
                        className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black hover:border-[var(--accent-blue)] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-mono font-black text-sm text-[var(--text-primary)]">
                        {currentStock}
                      </span>
                      <button
                        onClick={() => handleStockChange(p.id, currentStock + 1, p.title || p.name || "کالا")}
                        className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black hover:border-[var(--accent-blue)] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={"px-3.5 py-1.5 rounded-xl text-[10px] font-black " + (
                      currentStock > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                    )}>
                      {currentStock > 0 ? "موجود در انبار ✓" : "اتمام موجودی ✕"}
                    </span>
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
