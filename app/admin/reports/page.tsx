"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/formatters";

interface LowStockItem {
  id: string;
  title: string;
  stock: number;
  price: number;
  category?: string;
}

interface ReportData {
  total_revenue: number;
  total_orders_count: number;
  paid_orders_count: number;
  low_stock_items: LowStockItem[];
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportData>({
    total_revenue: 0,
    total_orders_count: 0,
    paid_orders_count: 0,
    low_stock_items: [],
  });

  const [loading, setLoading] = useState(true);
  const [quickStockInputs, setQuickStockInputs] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      const json = await res.json();
      if (res.ok && json.success && json.report) {
        setReport(json.report);
      }
    } catch {
      console.error("خطا در دریافت گزارشات تحلیلی.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    // همگام‌سازی بلادرنگ کسری انبار و فروش هنگام تغییر فاکتورها یا محصولات
    const chProd = supabase
      .channel("realtime-reports-prods")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchReports())
      .subscribe();

    const chOrders = supabase
      .channel("realtime-reports-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchReports())
      .subscribe();

    return () => {
      supabase.removeChannel(chProd);
      supabase.removeChannel(chOrders);
    };
  }, []);

  const handleQuickRestock = async (item: LowStockItem) => {
    const addCount = quickStockInputs[item.id];
    if (!addCount || addCount <= 0) return;

    soundEngine.playClick();
    setUpdatingId(item.id);

    try {
      const newStock = Number(item.stock) + Number(addCount);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          stock: newStock,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setQuickStockInputs((prev) => ({ ...prev, [item.id]: 0 }));
        fetchReports();
      } else {
        alert(json.message || "خطا در بروزرسانی موجودی انبار.");
      }
    } catch {
      alert("خطا در برقراری ارتباط با سرور.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر صفحه */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📈</span> تحلیل عملکرد مالی و پایش کسری انبار (بلادرنگ)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            بررسی نرخ تسویه‌حساب سفارشات، تفکیک درآمد کل و شارژ فوری کالاهای رو به اتمام
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            fetchReports();
          }}
          className="px-5 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <span>🔄</span> تازه‌سازی آمار
        </button>
      </div>

      {/* کارت‌های خلاصه تحلیلی */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 block font-bold">درآمد ناخالص تاییدشده</span>
          <div className="text-xl font-black font-mono text-emerald-400" suppressHydrationWarning>
            {loading ? "..." : `${formatPrice(report.total_revenue || 0)} تومان`}
          </div>
          <span className="text-[11px] text-slate-400 block">محاسبه‌شده از سفارشات پرداخت‌شده</span>
        </div>

        <div className="p-6 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 block font-bold">نرخ موفقیت پرداخت‌ها</span>
          <div className="text-xl font-black font-mono text-[var(--accent-blue)]">
            {loading
              ? "..."
              : report.total_orders_count > 0
              ? `${Math.round((report.paid_orders_count / report.total_orders_count) * 100)}%`
              : "۰٪"}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {report.paid_orders_count} سفارش موفق از مجموع {report.total_orders_count}
          </span>
        </div>

        <div className="p-6 rounded-[2rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 block font-bold">کالاهای دارای کسری موجودی</span>
          <div className="text-xl font-black font-mono text-rose-400">
            {loading ? "..." : `${report.low_stock_items?.length || 0} قلم`}
          </div>
          <span className="text-[11px] text-slate-400 block">نیازمند شارژ سریع انبار</span>
        </div>
      </div>

      {/* لیست کالاهای دارای کسری موجودی با ریسپانسیو کامل تبلت و موبایل */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
          <span>⚠️</span> فهرست کالاهای نیازمند تأمین موجودی
        </h2>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">در حال ارزیابی بلادرنگ انبار...</div>
        ) : !report.low_stock_items || report.low_stock_items.length === 0 ? (
          <div className="p-10 text-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl font-bold">
            ✔ هیچ کالایی با کسری بحرانی موجودی (زیر ۵ عدد) گزارش نشده است. انبار در وضعیت مطلوب قرار دارد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold">
                  <th className="pb-3 px-3">عنوان کالا</th>
                  <th className="pb-3 px-3">قیمت واحد</th>
                  <th className="pb-3 px-3">موجودی فعلی</th>
                  <th className="pb-3 px-3 text-left">اقدام سریع شارژ انبار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {report.low_stock_items.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--input-bg)]/40 transition">
                    <td className="py-3.5 px-3 font-bold text-[var(--text-primary)]">{item.title}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300" suppressHydrationWarning>
                      {formatPrice(item.price)} ت
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono font-bold">
                        {item.stock} عدد
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-left">
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          placeholder="+ تعداد"
                          value={quickStockInputs[item.id] || ""}
                          onChange={(e) =>
                            setQuickStockInputs((prev) => ({
                              ...prev,
                              [item.id]: Number(e.target.value),
                            }))
                          }
                          className="w-20 px-2.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-center font-mono focus:outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]"
                        />
                        <button
                          disabled={updatingId === item.id || !quickStockInputs[item.id]}
                          onClick={() => handleQuickRestock(item)}
                          className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-bold hover:opacity-90 transition disabled:opacity-40 cursor-pointer text-xs"
                        >
                          {updatingId === item.id ? "..." : "شارژ انبار"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
