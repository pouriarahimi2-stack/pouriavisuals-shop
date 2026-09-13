"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  recentOrders: any[];
  recentLogs: any[];
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalOrders: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
    recentOrders: [],
    recentLogs: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, reportsRes, logsRes] = await Promise.all([
        fetch("/api/admin/orders").catch(() => null),
        fetch("/api/admin/reports").catch(() => null),
        fetch("/api/admin/audit-logs?limit=5").catch(() => null),
      ]);

      let totalSales = 0;
      let totalOrders = 0;
      let pendingOrdersCount = 0;
      let recentOrders: any[] = [];
      let lowStockCount = 0;
      let recentLogs: any[] = [];

      if (ordersRes && ordersRes.ok) {
        const oData = await ordersRes.json();
        const orders = oData.orders || [];
        totalOrders = orders.length;
        recentOrders = orders.slice(0, 5);

        orders.forEach((o: any) => {
          if (o.status === "paid" || o.status === "delivered") {
            totalSales += Number(o.final_amount || o.total_amount || 0);
          }
          if (o.status === "pending_manual_review" || o.status === "pending") {
            pendingOrdersCount++;
          }
        });
      }

      if (reportsRes && reportsRes.ok) {
        const rData = await reportsRes.json();
        lowStockCount = rData.report?.low_stock_items?.length || 0;
      }

      if (logsRes && logsRes.ok) {
        const lData = await logsRes.json();
        recentLogs = lData.logs || [];
      }

      setMetrics({
        totalSales,
        totalOrders,
        pendingOrdersCount,
        lowStockCount,
        recentOrders,
        recentLogs,
      });
    } catch (err) {
      console.error("خطا در واکشی آمار داشبورد:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر داشبورد و میانبرها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚡</span> مرکز فرماندهی و داشبورد آکسون کور
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            نمای کلی وضعیت مالی، سفارشات در انتظار اقدام، انبارداری و امنیت هسته
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/products"
            onClick={() => soundEngine.playClick()}
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>➕</span> افزودن کالا
          </Link>
          <Link
            href="/admin/backup"
            onClick={() => soundEngine.playClick()}
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-border)] text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>💾</span> نسخه پشتیبان
          </Link>
          <button
            onClick={() => {
              soundEngine.playClick();
              fetchDashboardData();
            }}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow"
          >
            <span>🔄</span> بروزرسانی
          </button>
        </div>
      </div>

      {/* کارت‌های آماری شاخص کلیدی (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مجموع فروش محقق‌شده</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-lg font-black font-mono text-emerald-400">
            {loading ? "..." : `${metrics.totalSales.toLocaleString("fa-IR")} تومان`}
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">فاکتورهای پرداخت‌شده و تحویل‌شده</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>سفارشات در انتظار بررسی</span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-lg font-black font-mono text-amber-400">
            {loading ? "..." : `${metrics.pendingOrdersCount} سفارش`}
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">نیازمند تأیید فیش واریزی</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>هشدار کسری انبار</span>
            <span className="text-lg">⚠️</span>
          </div>
          <div className="text-lg font-black font-mono text-rose-400">
            {loading ? "..." : `${metrics.lowStockCount} قلم کالا`}
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">موجودی کمتر از ۵ عدد</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل سفارشات ثبت‌شده</span>
            <span className="text-lg">📦</span>
          </div>
          <div className="text-lg font-black font-mono text-[var(--accent-blue)]">
            {loading ? "..." : `${metrics.totalOrders} رکورد`}
          </div>
          <span className="text-[10px] text-slate-400 block font-sans">حجم کل تعاملات فروشگاه</span>
        </div>
      </div>

      {/* بخش دو ستونه: آخرین سفارشات و آخرین وقایع امنیتی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ستون آخرین سفارشات */}
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <span>🛍️</span> آخرین سفارشات ثبت‌شده
            </h2>
            <Link
              href="/admin/orders"
              className="text-[11px] text-[var(--accent-blue)] hover:underline font-bold"
            >
              مشاهده همه
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری...</div>
          ) : metrics.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">هیچ سفارشی ثبت نشده است.</div>
          ) : (
            <div className="space-y-2.5">
              {metrics.recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">{ord.customer_name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {ord.customer_phone} • #{ord.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono font-bold text-emerald-400 block">
                      {Number(ord.final_amount || ord.total_amount).toLocaleString("fa-IR")} ت
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ord.created_at).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ستون آخرین وقایع امنیتی */}
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <span>🛡️</span> آخرین لاگ‌های امنیتی (Audit Trails)
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-[11px] text-[var(--accent-blue)] hover:underline font-bold"
            >
              دفتر کل وقایع
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">در حال بارگذاری...</div>
          ) : metrics.recentLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">هیچ رخدادی ثبت نشده است.</div>
          ) : (
            <div className="space-y-2.5">
              {metrics.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="font-mono text-[11px] text-slate-300 block font-medium">
                      {log.target_resource}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-[10px] text-slate-400 block">{log.ip_address}</span>
                    <span className="font-mono text-[10px] text-slate-500 block">
                      {new Date(log.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
