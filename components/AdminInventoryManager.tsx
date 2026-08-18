"use client";

import React, { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";

interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  type: "in" | "out" | "adjustment";
  amount: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
}

export default function AdminInventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // مودال ورود/خروج کالا
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [changeType, setChangeType] = useState<"in" | "out">("in");
  const [changeAmount, setChangeAmount] = useState<number>(1);
  const [changeReason, setChangeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const prods = await productService.getAll();
      setProducts(prods);

      if (supabase) {
        const { data } = await supabase
          .from("inventory_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (data) setLogs(data);
      } else {
        const localLogs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
        setLogs(localLogs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleProductUpdate = (e: any) => {
      if (e.detail) setProducts(e.detail);
      else loadData();
    };
    window.addEventListener("products_updated", handleProductUpdate);
    return () => window.removeEventListener("products_updated", handleProductUpdate);
  }, []);

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || changeAmount <= 0) return;

    setSubmitting(true);
    const currentStock = selectedProduct.stock ?? 0;
    const newStock =
      changeType === "in"
        ? currentStock + changeAmount
        : Math.max(0, currentStock - changeAmount);

    try {
      // ۱. به‌روزرسانی موجودی در سرویس محصولات
      await productService.update(selectedProduct.id, {
        stock: newStock,
        is_available: newStock > 0,
      });

      // ۲. ثبت لاگ ورود و خروج انبار
      const newLog: InventoryLog = {
        id: `log_${Date.now()}`,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        type: changeType,
        amount: changeAmount,
        previous_stock: currentStock,
        new_stock: newStock,
        reason: changeReason.trim() || (changeType === "in" ? "ورود به انبار (خرید/تولید)" : "خروج از انبار (فروش دستی/مرجوعی)"),
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("inventory_logs").insert([newLog]);
      }

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("inventory_logs", JSON.stringify(updatedLogs));

      showToast(`موجودی کالای "${selectedProduct.name}" با موفقیت به ${newStock} تغییر یافت.`);
      setSelectedProduct(null);
      setChangeAmount(1);
      setChangeReason("");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const isLow = (p.stock ?? 0) <= 3;
    return matchSearch && (filterLowStock ? isLow : true);
  });

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش انبارداری */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>🏢</span> سامانه مدیریت انبار و پایش موجودی کالاها
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ثبت ورود و خروج انبار، کنترل لحظه‌ای تیراژ کالاها و لاگ‌های گردش انبار
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer border ${
              filterLowStock
                ? "bg-rose-500 text-white border-rose-500 shadow-md"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]"
            }`}
          >
            ⚠️ کالاهای رو به اتمام (کمتر از ۳ عدد)
          </button>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجو در اقلام انبار..."
            className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] w-56"
          />
        </div>
      </div>

      {/* جدول موجودی اقلام */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بررسی انبار...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-[var(--text-secondary)]">کالایی یافت نشد.</div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="pb-3 px-2">تصویر و نام کالا</th>
                <th className="pb-3 px-2">دسته‌بندی</th>
                <th className="pb-3 px-2">موجودی فعلی</th>
                <th className="pb-3 px-2">وضعیت دسترسی</th>
                <th className="pb-3 px-2 text-center">عملیات انبار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredProducts.map((p) => {
                const stock = p.stock ?? 0;
                return (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || p.image || ""}
                          alt=""
                          className="w-10 h-10 rounded-xl object-contain bg-[var(--input-bg)] p-1 border border-[var(--card-border)]"
                        />
                        <span className="font-extrabold text-xs text-[var(--text-primary)]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-bold text-[var(--text-secondary)]">{p.category || "عمومی"}</td>
                    <td className="py-3 px-2 font-mono font-black text-sm">
                      <span className={stock === 0 ? "text-rose-500" : stock <= 3 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}>
                        {stock} عدد
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        stock > 0 && p.is_available !== false
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}>
                        {stock > 0 && p.is_available !== false ? "موجود در ویترین" : "ناموجود"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-[11px] hover:opacity-90 transition cursor-pointer shadow-md"
                      >
                        🔄 ورود / خروج کالا
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* آخرین گردش‌های ثبت‌شده در انبار */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h4 className="font-black text-sm text-[var(--text-primary)]">📋 آخرین سوابق و لاگ‌های گردش انبار</h4>
        {logs.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] font-bold py-4 text-center">گردش انباری ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                  <th className="pb-3 px-2">نام محصول</th>
                  <th className="pb-3 px-2">عملیات</th>
                  <th className="pb-3 px-2">تعداد</th>
                  <th className="pb-3 px-2">تغییر موجودی</th>
                  <th className="pb-3 px-2">دلیل / توضیح</th>
                  <th className="pb-3 px-2">تاریخ و زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-2 font-bold">{log.product_name}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.type === "in"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}>
                        {log.type === "in" ? "📥 ورود به انبار" : "📤 خروج از انبار"}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold">{log.amount} عدد</td>
                    <td className="py-3 px-2 font-mono text-[11px] text-[var(--text-secondary)]">
                      {log.previous_stock} ← <strong className="text-[var(--text-primary)]">{log.new_stock}</strong>
                    </td>
                    <td className="py-3 px-2 text-[11px] text-[var(--text-secondary)]">{log.reason}</td>
                    <td className="py-3 px-2 font-mono text-[10px] text-[var(--text-secondary)]">
                      {new Date(log.created_at).toLocaleDateString("fa-IR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال ورود و خروج کالا */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleStockSubmit} className="max-w-md w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div>
                <h4 className="font-black text-sm text-[var(--accent-blue)]">ثبت حواله ورود/خروج کالا</h4>
                <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">نوع عملیات انبار *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChangeType("in")}
                    className={`py-2.5 rounded-xl font-bold transition cursor-pointer ${
                      changeType === "in"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-[var(--input-bg)] border border-[var(--card-border)]"
                    }`}
                  >
                    📥 ورود به انبار (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType("out")}
                    className={`py-2.5 rounded-xl font-bold transition cursor-pointer ${
                      changeType === "out"
                        ? "bg-rose-600 text-white shadow-md"
                        : "bg-[var(--input-bg)] border border-[var(--card-border)]"
                    }`}
                  >
                    📤 خروج از انبار (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">تعداد اقلام *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">علت یا شماره فاکتور ورودی/خروجی</label>
                <input
                  type="text"
                  placeholder="مثال: فاکتور خرید شرکت، کسری دستی و..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)]"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? "در حال ثبت..." : "ثبت حواله انبار 💾"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}