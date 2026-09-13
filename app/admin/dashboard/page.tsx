"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface AnalyticsReport {
  total_revenue: number;
  successful_orders: number;
  total_orders: number;
  pending_manual_reviews: number;
  total_products: number;
  low_stock_count: number;
  low_stock_items: Array<{
    id: string;
    title: string;
    stock: number;
    price: number;
  }>;
  generated_at: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reports");
      if (!res.ok) throw new Error("خطا در واکشی گزارش‌های سرور.");
      const json = await res.json();
      if (json.success) {
        setData(json.report);
      } else {
        throw new Error(json.message || "خطا در پردازش اطلاعات گزارش.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* سربرگ داشبورد */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📊</span> میز فرمان و شاخص‌های کلیدی عملکرد (Axon Overview)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            آمار بلادرنگ فروشگاه، درآمد ناخالص سفارشات و وضعیت ذخایر انبار مرکزی
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            fetchReport();
          }}
          className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <span>🔄</span> به‌روزرسانی آمار
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
          {error}
        </div>
      )}

      {/* ردیف کارت‌های KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 font-bold block">مجموع درآمد تایید شده</span>
          <div className="text-xl font-black text-emerald-500 font-mono">
            {loading ? "..." : (data?.total_revenue || 0).toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 block">از سفارش‌های پرداخت شده</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 font-bold block">نیازمند بررسی فیش واریزی</span>
          <div className="text-xl font-black text-amber-400 font-mono flex items-center justify-between">
            <span>{loading ? "..." : (data?.pending_manual_reviews || 0).toLocaleString("fa-IR")}</span>
            {(data?.pending_manual_reviews || 0) > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 animate-pulse">
                اقدام فوری
              </span>
            )}
          </div>
          <Link href="/admin/orders" className="text-[11px] text-[var(--accent-blue)] hover:underline block font-bold">
            مشاهده سفارشات ↗
          </Link>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 font-bold block">تعداد کل سفارش‌ها</span>
          <div className="text-xl font-black text-[var(--text-primary)] font-mono">
            {loading ? "..." : (data?.total_orders || 0).toLocaleString("fa-IR")}
          </div>
          <span className="text-[11px] text-slate-400 block">
            موفق: {(data?.successful_orders || 0).toLocaleString("fa-IR")} سفارش
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <span className="text-xs text-slate-400 font-bold block">هشدار کسری انبار</span>
          <div className="text-xl font-black text-rose-400 font-mono">
            {loading ? "..." : (data?.low_stock_count || 0).toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-slate-400">کالا</span>
          </div>
          <span className="text-[11px] text-rose-400/80 block">موجودی کمتر از ۵ عدد</span>
        </div>
      </div>

      {/* جدول کالاهای رو به اتمام */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
            <span>⚠️</span> فهرست اولویت‌دار کالاهای نیازمند تامین موجودی
          </h2>
          <Link
            href="/admin/products"
            className="text-xs font-bold text-[var(--accent-blue)] hover:underline"
          >
            مدیریت کامل انبار ↗
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">در حال ارزیابی موجودی انبار...</div>
        ) : (data?.low_stock_items || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-emerald-500 font-bold">
            ✓ موجودی تمامی اقلام فروشگاه در وضعیت مطلوب قرار دارد.
          </div>
        ) : (
          <div className="divide-y divide-[var(--card-border)]">
            {data?.low_stock_items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-[var(--text-primary)] block">{item.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    قیمت واحد: {Number(item.price).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
                    مانده: {item.stock} عدد
                  </span>
                  <Link
                    href="/admin/products"
                    className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold hover:bg-[var(--accent-blue)] hover:text-white transition"
                  >
                    ویرایش موجودی
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
