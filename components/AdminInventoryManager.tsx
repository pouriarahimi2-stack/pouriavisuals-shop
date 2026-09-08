"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface FinancialItem {
  id: string;
  title: string;
  category: string;
  stock: number;
  isAvailable: boolean;
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

export default function AdminInventoryManager() {
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [summary, setSummary] = useState({
    totalInventoryAssets: 0,
    totalMonthlySalesGross: 0,
    totalMonthlyVAT: 0,
    totalMonthlyNetProfit: 0,
    totalUnitsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeModalItem, setActiveModalItem] = useState<FinancialItem | null>(null);

  // فرم ورود بار به انبار
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [costPriceInput, setCostPriceInput] = useState<number>(0);
  const [supplierInput, setSupplierInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAccountingData = async () => {
    try {
      const res = await fetch("/api/accounting", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setItems(json.productFinancials || []);
        setSummary(json.summary || {});
      }
    } catch (e) {
      console.error("Accounting data error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();

    // اتصال بلادرنگ به تغییرات موجودی و سفارش‌ها
    const chProds = supabase.channel("accounting-realtime-prods")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchAccountingData())
      .subscribe();

    const chOrders = supabase.channel("accounting-realtime-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAccountingData())
      .subscribe();

    return () => {
      supabase.removeChannel(chProds);
      supabase.removeChannel(chOrders);
    };
  }, []);

  const openWarehouseModal = (item: FinancialItem) => {
    soundEngine.playClick();
    setActiveModalItem(item);
    setCostPriceInput(item.purchasePrice);
    setStockDelta(10);
    setSupplierInput("نمایندگی رسمی اپل / دبی");
    setNoteInput("پارت ورودی جدید با فاکتور رسمی");
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeModalItem.id,
          purchasePrice: costPriceInput,
          stockDelta,
          supplier: supplierInput,
          referenceNote: noteInput,
        }),
      });

      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        alert("✓ سند ورود به انبار و بهای تمام‌شده با موفقیت در دیتابیس ثبت شد.");
        setActiveModalItem(null);
        fetchAccountingData();
      } else {
        alert(json.message || "خطا در ثبت سند.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // صدور فایل اکسل حسابرسی استاندارد
  const exportToExcel = () => {
    soundEngine.playClick();
    const headers = [
      "شناسه کالا",
      "نام محصول",
      "دسته‌بندی",
      "موجودی انبار",
      "بهای خرید واحد (تومان)",
      "بهای فروش واحد (تومان)",
      "مالیات بر ارزش افزوده ۱۰٪ واحد",
      "سود خالص هر واحد",
      "حاشیه سود ٪",
      "تعداد فروش ۳۰ روزه",
      "فروش ناخالص ماهانه (تومان)",
      "مالیات ۱۰٪ ماهانه (تومان)",
      "سود خالص ماهانه (تومان)"
    ];

    const rows = items.map((i) => [
      i.id,
      '"' + i.title.replace(/"/g, '""') + '"',
      i.category,
      i.stock,
      i.purchasePrice,
      i.sellingPrice,
      i.vatPerUnit,
      i.netProfitPerUnit,
      i.profitMarginPercent + "%",
      i.unitsSoldMonthly,
      i.totalRevenueMonthly,
      i.totalVatMonthly,
      i.totalNetProfitMonthly
    ]);

    const csvContent = "﻿" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "گزارش_حسابرسی_و_انبارداری_آکسون_" + new Date().toLocaleDateString("fa-IR").replace(/\//g, "-") + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = items.filter(
    (i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* هدر ماژول حسابداری و انبار */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📊</span> سیستم جامع حسابداری، بهای تمام‌شده و انبارداری متمرکز
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            محاسبه خودکار ۱۰٪ مالیات ارزش افزوده، بهای خرید، سود خالص هر کالا و صدور ترازنامه رسمی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>صدور خروجی رسمی Excel / CSV</span>
          </button>
          <button
            onClick={fetchAccountingData}
            className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer"
            title="به‌روزرسانی محاسبات"
          >
            🔄
          </button>
        </div>
      </div>

      {/* کارت‌های شاخص‌های مالی و سودآوری */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold block">ارزش سرمایه موجود در انبار:</span>
          <span className="text-xl font-black font-mono text-[var(--accent-blue)] block">
            {summary.totalInventoryAssets.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">بر مبنای بهای خرید (COGS)</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold block">گردش فروش ۳۰ روزه:</span>
          <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
            {summary.totalMonthlySalesGross.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">تیراژ: {summary.totalUnitsSold} کالا فروخته شده</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-1.5 shadow-sm">
          <span className="text-[var(--text-secondary)] font-bold block">مالیات بر ارزش افزوده (۱۰٪):</span>
          <span className="text-xl font-black font-mono text-amber-500 block">
            {summary.totalMonthlyVAT.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">تعهد مالیاتی ثبت‌شده ۳۰ روزه</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-emerald-500/30 space-y-1.5 shadow-sm bg-emerald-500/5">
          <span className="text-emerald-600 dark:text-emerald-400 font-black block">سود خالص عملیاتی ۳۰ روزه:</span>
          <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
            {summary.totalMonthlyNetProfit.toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
          </span>
          <span className="text-[10px] text-emerald-500 font-medium">پس از کسر خرید و کسر ۱۰٪ مالیات</span>
        </div>
      </div>

      {/* جستجو و جدول جامع حسابداری کالاها */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex justify-between items-center gap-4">
          <h3 className="font-black text-xs text-[var(--text-primary)]">
            📋 ماتریس بهای تمام‌شده، مالیات و انبارگردانی ({items.length} قلم کالا)
          </h3>
          <div className="w-72">
            <input
              type="text"
              placeholder="🔍 جستجو در اقلام انبار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black pb-3 text-[11px]">
                <th className="p-3">نام محصول</th>
                <th className="p-3 text-center">موجودی انبار</th>
                <th className="p-3">بهای خرید واحد</th>
                <th className="p-3">نرخ فروش واحد</th>
                <th className="p-3 text-center">مالیات ۱۰٪</th>
                <th className="p-3">سود خالص واحد</th>
                <th className="p-3 text-center">فروش ماه</th>
                <th className="p-3">سود کل ماهانه</th>
                <th className="p-3 text-center">انبارگردانی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">در حال پردازش تراز مالی و استعلام بلادرنگ انبار...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">کالایی یافت نشد.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--input-bg)]/60 transition">
                    <td className="p-3">
                      <div className="font-black text-[var(--text-primary)]">{item.title}</div>
                      <span className="text-[10px] text-[var(--text-secondary)]">{item.category}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={"px-2.5 py-1 rounded-xl " + (item.stock < 3 ? "bg-rose-500/15 text-rose-500 font-black" : "bg-emerald-500/15 text-emerald-600")}>
                        {item.stock} عدد
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-400">
                      {item.purchasePrice.toLocaleString("fa-IR")} ت
                    </td>
                    <td className="p-3 font-mono font-black text-[var(--text-primary)]">
                      {item.sellingPrice.toLocaleString("fa-IR")} ت
                    </td>
                    <td className="p-3 text-center font-mono text-amber-500 font-bold">
                      {item.vatPerUnit.toLocaleString("fa-IR")} ت
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {item.netProfitPerUnit.toLocaleString("fa-IR")} ت
                      <span className="text-[9px] text-slate-400 mr-1">({item.profitMarginPercent}%)</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      {item.unitsSoldMonthly} عدد
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {item.totalNetProfitMonthly.toLocaleString("fa-IR")} ت
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openWarehouseModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white font-black text-[11px] transition cursor-pointer"
                      >
                        📦 ثبت ورود بار
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدال ثبت پارت ورودی انبارگردانی */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-5 text-xs text-[var(--text-primary)] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">سند انبارداری و ثبت بهای خرید: {activeModalItem.title}</h3>
              <button onClick={() => setActiveModalItem(null)} className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold">✕</button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تعداد ورودی به انبار (+ واحد):</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">بهای خرید هر واحد فاکتور (تومان):</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={costPriceInput}
                  onChange={(e) => setCostPriceInput(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام تأمین‌کننده / منبع بار:</label>
                <input
                  type="text"
                  value={supplierInput}
                  onChange={(e) => setSupplierInput(e.target.value)}
                  placeholder="مثال: واردکننده رسمی، انبار مرکزی..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">شماره بارنامه یا یادداشت مرجع:</label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="مثال: فاکتور خرید ۹۸۵۴ پارت جدید..."
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-medium outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] leading-relaxed text-blue-400 font-medium">
                ⚡ با ثبت این سند، موجودی انبار به میزان {stockDelta} عدد افزایش یافته و مبنای سود خالص و مالیات ۱۰٪ در ترازنامه به‌روزرسانی می‌شود.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-xl cursor-pointer disabled:opacity-50"
              >
                {submitting ? "در حال ثبت سند مالی..." : "ثبت قطعی در انبار و کاردکس کالا 🔒"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
