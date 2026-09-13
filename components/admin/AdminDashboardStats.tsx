// File Path: components/admin/AdminDashboardStats.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";

export default function AdminDashboardStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSales: 0,
    inventoryValuation: 0,
    lowStockCount: 0,
    unreadMessages: 0,
    totalCustomers: 0,
    vipCustomersCount: 0,
    totalPosts: 0,
    totalNews: 0,
    activeCoupons: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        setRecentOrders(json.recentOrders || []);
      }
    } catch (e) {
      console.error("Dashboard stats error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();

    // همگام‌سازی بلادرنگ تمامی جداول از طریق WebSockets سوپابیس
    const chOrders = supabase.channel("live-dash-orders-cdc")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchLiveStats())
      .subscribe();

    const chProds = supabase.channel("live-dash-prods-cdc")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchLiveStats())
      .subscribe();

    const chMsgs = supabase.channel("live-dash-msgs-cdc")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => fetchLiveStats())
      .subscribe();

    return () => {
      supabase.removeChannel(chOrders);
      supabase.removeChannel(chProds);
      supabase.removeChannel(chMsgs);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">پرداخت شده ✓</span>;
      case "shipped":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">تحویل به پست 🚚</span>;
      case "delivered":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/30">تحویل شده</span>;
      case "cancelled":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">لغو شده</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">در انتظار</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* سربرگ */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">
            📊
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">داشبورد هوشمند و مرکز فرماندهی بلادرنگ آکسون</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              پایش بلادرنگ دیتابیس با وب‌سوکت CDC (بدون نیاز به رفرش صفحه)
            </p>
          </div>
        </div>

        <button
          onClick={() => { soundEngine.playClick(); fetchLiveStats(); }}
          className="px-5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <span>🔄</span>
          <span>استعلام لحظه‌ای</span>
        </button>
      </div>

      {/* ۱. شاخص‌های اصلی فروش و انبارداری */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm group hover:border-emerald-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>گردش مالی و فروش کل</span>
            <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 text-sm">💳</span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
            {loading ? "..." : formatPrice(stats.totalSales)} <span className="text-xs font-normal">تومان</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">تراکنش‌های تاییدشده در دیتابیس</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm group hover:border-indigo-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>سفارش‌ها و فاکتورها</span>
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500 text-sm">📄</span>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-400">
            {loading ? "..." : stats.totalOrders} <span className="text-xs font-bold text-[var(--text-secondary)]">سفارش</span>
          </div>
          <span className="text-[10px] text-amber-500 font-bold block">
            {stats.pendingOrders} فاکتور در انتظار پردازش و ارسال
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm group hover:border-amber-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>موجودی بحرانی انبار</span>
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 text-sm">⚠️</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-500">
            {loading ? "..." : stats.lowStockCount} <span className="text-xs font-bold text-[var(--text-secondary)]">قلم کالا</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">کمتر از ۳ عدد موجود در انبار مرکزی</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm group hover:border-blue-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>ارزش ریالی موجودی انبار</span>
            <span className="p-2 rounded-2xl bg-blue-500/10 text-blue-500 text-sm">📦</span>
          </div>
          <div className="text-xl font-black font-mono text-[var(--accent-blue)]" suppressHydrationWarning>
            {loading ? "..." : formatPrice(stats.inventoryValuation)} <span className="text-xs font-normal">تومان</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">سرمایه کل بهای تمام‌شده کالاها</span>
        </div>
      </div>

      {/* ۲. جدول زنده آخرین سفارش‌ها */}
      <div className="bg-[var(--modal-bg)] p-6 rounded-[2.5rem] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h3 className="font-black text-xs sm:text-sm">آخرین فاکتورهای صادر شده در سیستم</h3>
          </div>
          <Link
            href="/admin/orders"
            className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline"
          >
            مشاهده تمام سفارش‌ها ←
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black text-[11px] pb-3">
                <th className="p-3">شناسه فاکتور</th>
                <th className="p-3">نام خریدار</th>
                <th className="p-3">شماره تماس</th>
                <th className="p-3">مبلغ پرداختی</th>
                <th className="p-3 text-center">وضعیت فاکتور</th>
                <th className="p-3 text-left">زمان ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">در حال بارگذاری تراکنش‌ها...</td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">هنوز فاکتوری در سامانه ثبت نشده است.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--input-bg)]/60 transition">
                    <td className="p-3 font-mono font-black text-[var(--accent-blue)]">{order.id}</td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{order.customerName}</td>
                    <td className="p-3 font-mono text-slate-400">{order.phone}</td>
                    <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                      {formatPrice(order.amount)} تومان
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(order.status)}</td>
                    <td className="p-3 text-left font-mono text-[10px] text-slate-400">
                      {order.date ? new Date(order.date).toLocaleString("fa-IR") : "هم‌اکنون"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
