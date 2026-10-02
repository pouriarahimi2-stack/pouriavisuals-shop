// File Path: components/AdminInventoryManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import OrderManager from "@/components/admin/OrderManager";

export interface ProductFinancialRow {
  id: string;
  title: string;
  sku: string;
  brand: string;
  category: string;
  warranty: string;
  stock: number;
  isAvailable: boolean;
  basePrice: number;
  discountPrice: number | null;
  sellingPrice: number;
  purchasePrice: number;
  vatPerUnit: number;
  netProfitPerUnit: number;
  profitMarginPercent: number;
  unitsSoldMonthly: number;
  totalRevenueMonthly: number;
  totalPurchaseCostMonthly: number;
  totalVatMonthly: number;
  totalNetProfitMonthly: number;
}

export function AdminInventoryManager({
  defaultSubTab = "accounting",
}: {
  defaultSubTab?: "accounting" | "orders" | "reports";
}) {
  const [activeSubTab, setActiveSubTab] = useState<"accounting" | "orders" | "reports">(defaultSubTab);
  const [items, setItems] = useState<ProductFinancialRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalInventoryAssets: 0,
    totalMonthlySalesGross: 0,
    totalMonthlyVAT: 0,
    totalMonthlyNetProfit: 0,
    totalUnitsSold: 0,
    totalOrdersMonthlyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // فرم ورود / کسر موجودی انبار
  const [selectedProdId, setSelectedProdId] = useState("");
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [purchaseCostInput, setPurchaseCostInput] = useState<number | "">("");
  const [supplierInput, setSupplierInput] = useState("تأمین‌کننده رسمی");
  const [noteInput, setNoteInput] = useState("");
  const [submittingStock, setSubmittingStock] = useState(false);

  // مودال سوال تاییدیه امنیتی هنگام ورود مجدد موجودی
  const [confirmRestockModal, setConfirmRestockModal] = useState<{
    isOpen: boolean;
    product: ProductFinancialRow | null;
    delta: number;
  }>({ isOpen: false, product: null, delta: 0 });

  // مودال ویرایش ۱۰۰٪ کامل کالا در حسابداری و انبار
  const [editingProduct, setEditingProduct] = useState<ProductFinancialRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAccountingData = async () => {
    try {
      const res = await fetch("/api/accounting", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        const list = json.productFinancials || [];
        setItems(list);
        setSummary(json.summary || summary);
        setLogs(json.inventoryLogs || []);
        if (!selectedProdId && list.length > 0) {
          setSelectedProdId(list[0].id);
          setPurchaseCostInput(list[0].purchasePrice || "");
        }
      }
    } catch (e) {
      console.error("Accounting fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();

    const chProds = supabase
      .channel("realtime-accounting-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchAccountingData();
      })
      .subscribe();

    const chOrders = supabase
      .channel("realtime-accounting-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchAccountingData();
      })
      .subscribe();

    const chLogs = supabase
      .channel("realtime-accounting-logs")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_logs" }, () => {
        fetchAccountingData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chProds);
      supabase.removeChannel(chOrders);
      supabase.removeChannel(chLogs);
    };
  }, []);

  const executeRestockTransaction = async () => {
    if (!selectedProdId) return;
    soundEngine.playClick();
    setSubmittingStock(true);
    setConfirmRestockModal({ isOpen: false, product: null, delta: 0 });

    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProdId,
          stockDelta: Number(stockDelta),
          purchasePrice: purchaseCostInput !== "" ? Number(purchaseCostInput) : undefined,
          supplier: supplierInput.trim(),
          referenceNote: noteInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setNoteInput("");
        fetchAccountingData();
      } else {
        notify(json.message || "خطا در ثبت سند انبار.", "error");
      }
    } finally {
      setSubmittingStock(false);
    }
  };

  // بررسی هوشمند قبل از ثبت ورود کالا: اگر کالا موجودی دارد، حتماً از ادمین سوال تاییدیه پرسیده شود
  const handlePrepareRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const targetProd = items.find((p) => p.id === selectedProdId);
    if (!targetProd) return;

    if (Number(stockDelta) > 0 && targetProd.stock > 0) {
      setConfirmRestockModal({
        isOpen: true,
        product: targetProd,
        delta: Number(stockDelta),
      });
      return;
    }

    executeRestockTransaction();
  };

  const handleSaveFullProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    soundEngine.playClick();
    setSavingEdit(true);

    try {
      const res = await fetch("/api/accounting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setEditingProduct(null);
        fetchAccountingData();
      } else {
        notify(json.message || "خطا در ویرایش کالا.", "error");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportMonthlyCsv = () => {
    soundEngine.playSuccess();
    let csv =
      "\uFEFFشناسه,عنوان کالا,دسته,موجودی فعلی,قیمت خرید (تومان),قیمت فروش (تومان),تعداد فروش ماهانه,گردش مالی ماهانه,مالیات ماهانه,سود خالص ماهانه\n";
    items.forEach((p) => {
      csv +=
        '"' +
        p.id +
        '","' +
        p.title +
        '","' +
        p.category +
        '",' +
        p.stock +
        "," +
        p.purchasePrice +
        "," +
        p.sellingPrice +
        "," +
        p.unitsSoldMonthly +
        "," +
        p.totalRevenueMonthly +
        "," +
        p.totalVatMonthly +
        "," +
        p.totalNetProfitMonthly +
        "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "axon_monthly_financial_statement.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredItems = items.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* هدر یکپارچه ادغام ۳ بخش: حسابداری و انبار + سفارشات و بارنامه + گزارش‌های مالی */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🏛️</span> مرکز یکپارچه حسابداری، انبار، سفارشات و گردش مالی ماهانه
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ادغام کامل حسابداری، انبارگردانی، صدور بارنامه سفارشات و ترازنامه مالی در یک بخش واحد (Realtime)
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto text-xs font-black">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("accounting");
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeSubTab === "accounting"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🏭 ۱. حسابداری و انبار کالا
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("orders");
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeSubTab === "orders"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            📦 ۲. سفارشات و صدور بارنامه
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveSubTab("reports");
            }}
            className={
              "flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeSubTab === "reports"
                ? "bg-[var(--accent-blue)] text-white shadow-lg"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            📈 ۳. گزارش مالی و گردش آخر ماه
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {feedback.text}
        </div>
      )}

      {/* کارت‌های خلاصه ترازنامه مالی و انبار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">ارزش دارایی موجودی انبار:</span>
          <span className="text-lg sm:text-xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.totalInventoryAssets.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">بر مبنای قیمت خرید واحد</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">فروش ناخالص ۳۰ روز اخیر:</span>
          <span className="text-lg sm:text-xl font-black font-mono text-emerald-500 block">
            {summary.totalMonthlySalesGross.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">{summary.totalUnitsSold} قلم کالای فروخته‌شده</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">مالیات بر ارزش افزوده (۱۰٪):</span>
          <span className="text-lg sm:text-xl font-black font-mono text-amber-500 block">
            {summary.totalMonthlyVAT.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">ذخیره قانونی مالیاتی</span>
        </div>
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold">سود خالص قطعی ماهانه:</span>
          <span className="text-lg sm:text-xl font-black font-mono text-indigo-400 block">
            {summary.totalMonthlyNetProfit.toLocaleString("fa-IR")} ت
          </span>
          <span className="text-[10px] text-slate-400">پس از کسر بهای خرید و مالیات</span>
        </div>
      </div>

      {/* زیرمنوی ۲: سفارشات و بارنامه */}
      {activeSubTab === "orders" && <OrderManager />}

      {/* زیرمنوی ۱: حسابداری و انبار کالا */}
      {activeSubTab === "accounting" && (
        <div className="space-y-6 text-xs">
          {/* فرم ثبت ورود / خروج انبار با سیستم سوال تاییدیه امنیتی */}
          <form
            onSubmit={handlePrepareRestockSubmit}
            className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
          >
            <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ➕ ثبت سند ورود جدید به انبار / اصلاح موجودی و بهای خرید
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">انتخاب کالا:</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProdId(id);
                    const found = items.find((x) => x.id === id);
                    if (found) setPurchaseCostInput(found.purchasePrice);
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                >
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      📦 {p.title} (موجودی فعلی: {p.stock} عدد)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  تعداد افزایش (+) یا کاهش (-):
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black text-center outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  قیمت خرید واحد (تومان):
                </label>
                <input
                  type="number"
                  value={purchaseCostInput}
                  onChange={(e) =>
                    setPurchaseCostInput(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingStock}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer transition disabled:opacity-50"
                >
                  {submittingStock ? "در حال ثبت..." : "ثبت سند در انبار 💾"}
                </button>
              </div>
            </div>
          </form>

          {/* جدول کامل حسابداری و انبار با دکمه ویرایش ۱۰۰٪ هر محصول */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">
                جدول جامع کالاها، موجودی، بهای تمام‌شده و ویرایش کامل ({filteredItems.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 جستجوی نام کالا، دسته، SKU..."
                  className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={handleExportMonthlyCsv}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer shadow"
                >
                  📥 خروجی اکسل گردش حساب (CSV)
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-bold">در حال محاسبه اسناد حسابداری...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[920px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                      <th className="p-3">عنوان کالا و کد SKU</th>
                      <th className="p-3 text-center">موجودی انبار</th>
                      <th className="p-3">قیمت خرید واحد</th>
                      <th className="p-3">قیمت فروش واحد</th>
                      <th className="p-3">سود خالص واحد</th>
                      <th className="p-3 text-center">فروش ماه</th>
                      <th className="p-3">سود خالص ماهانه</th>
                      <th className="p-3 text-center">ویرایش کامل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)] font-medium">
                    {filteredItems.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--input-bg)]/50 transition">
                        <td className="p-3">
                          <div className="font-black text-[var(--text-primary)]">{p.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {p.sku} | {p.category}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={
                              "px-2.5 py-1 rounded-xl font-mono font-black " +
                              (p.stock > 3
                                ? "bg-emerald-500/15 text-emerald-400"
                                : p.stock > 0
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-rose-500/15 text-rose-400")
                            }
                          >
                            {p.stock} عدد
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {p.purchasePrice.toLocaleString("fa-IR")} ت
                        </td>
                        <td className="p-3 font-mono font-bold text-[var(--accent-blue)]">
                          {p.sellingPrice.toLocaleString("fa-IR")} ت
                        </td>
                        <td className="p-3 font-mono text-emerald-400">
                          {p.netProfitPerUnit.toLocaleString("fa-IR")} ت ({p.profitMarginPercent}%)
                        </td>
                        <td className="p-3 text-center font-mono font-bold">{p.unitsSoldMonthly}</td>
                        <td className="p-3 font-mono font-black text-indigo-400">
                          {p.totalNetProfitMonthly.toLocaleString("fa-IR")} ت
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setEditingProduct({ ...p });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black cursor-pointer transition"
                          >
                            ✏️ ویرایش کامل کالا
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* زیرمنوی ۳: گزارش مالی، گردش آخر ماه و تاریخچه اسناد انبار */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 text-xs">
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">
                  📊 گزارش جامع گردش حساب آخر ماه و تاریخچه ورود و خروج کالا
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  ثبت خودکار تمامی کسری‌های فروش آنلاین و اسناد ورود کالا به انبار
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportMonthlyCsv}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow-lg"
              >
                📥 دانلود ترازنامه کامل ماهانه (Excel / CSV)
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold">
                هنوز سند ورود یا خروجی در دفتر کل انبار ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "px-2.5 py-0.5 rounded-lg text-[10px] font-black " +
                            (log.change_type === "sale"
                              ? "bg-indigo-500/15 text-indigo-400"
                              : log.change_type === "restock"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400")
                          }
                        >
                          {log.change_type === "sale"
                            ? "کسر خودکار فروش 🛒"
                            : log.change_type === "restock"
                            ? "ورود کالا به انبار ➕"
                            : "ویرایش / انبارگردانی ✏️"}
                        </span>
                        <span className="font-black">{log.product_title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {log.reference_note} | تأمین‌کننده/مرجع: {log.supplier}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-[11px] shrink-0">
                      <span className="font-black text-[var(--accent-blue)]">تعداد: {log.quantity}</span>
                      <span className="text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString("fa-IR") : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* مودال سوال تاییدیه امنیتی هنگام ورود مجدد موجودی */}
      {confirmRestockModal.isOpen && confirmRestockModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[var(--modal-bg)] border border-amber-500/40 p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-amber-400">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-sm font-black">تاییدیه امنیتی ورود مجدد موجودی به انبار</h3>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed">
              کالای <strong className="text-[var(--text-primary)]">«{confirmRestockModal.product.title}»</strong> هم‌اکنون دارای{" "}
              <strong className="font-mono text-emerald-400">{confirmRestockModal.product.stock} عدد</strong> موجودی ثبت‌شده در انبار است.
              <br />
              آیا مطمئن هستید که می‌خواهید{" "}
              <strong className="font-mono text-amber-400">{confirmRestockModal.delta} عدد دیگر</strong> به موجودی فعلی این کالا اضافه کنید (جمع جدید:{" "}
              <strong className="font-mono">
                {confirmRestockModal.product.stock + confirmRestockModal.delta} عدد
              </strong>
              )؟
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setConfirmRestockModal({ isOpen: false, product: null, delta: 0 })}
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
              >
                انصراف (جلوگیری از ثبت تکراری)
              </button>
              <button
                type="button"
                onClick={executeRestockTransaction}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
              >
                ✓ بله، مطمئنم؛ اضافه شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ویرایش ۱۰۰٪ کامل محصول از داخل بخش حسابداری و انبار */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent-blue)]">
                ✏️ ویرایش کامل مشخصات، قیمت‌ها و موجودی کالا در حسابداری و انبار
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFullProductEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان کامل کالا *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">دسته‌بندی:</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">کد کالا (SKU):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    قیمت خرید واحد (بهای تمام‌شده - تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.purchasePrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, purchasePrice: Number(e.target.value) })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    قیمت فروش پایه (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.basePrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, basePrice: Number(e.target.value) })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    قیمت با تخفیف (اختیاری - تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.discountPrice || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    موجودی قطعی انبار (تعداد):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                    }
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-black outline-none focus:border-[var(--accent-blue)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">شرح گارانتی:</label>
                  <input
                    type="text"
                    value={editingProduct.warranty}
                    onChange={(e) => setEditingProduct({ ...editingProduct, warranty: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? "در حال ذخیره..." : "💾 ذخیره کامل تغییرات کالا"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventoryManager;
