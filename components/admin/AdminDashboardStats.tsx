"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    lowStockCount: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [prodsRes, ordersRes] = await Promise.all([
        supabase.from("products").select("id, price, discount_price, stock"),
        supabase.from("orders").select("id, total_amount, final_amount, status"),
      ]);

      const prods = prodsRes.data || [];
      const orders = ordersRes.data || [];

      const totalRevenue = orders.reduce((sum, o: any) => {
        const val = Number(o.final_amount || o.total_amount || 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      const lowStock = prods.filter((p: any) => {
        const stockNum = p.stock !== null && p.stock !== undefined ? Number(p.stock) : 10;
        return stockNum < 3;
      }).length;

      setStats({
        totalProducts: prods.length,
        activeOrders: orders.length,
        lowStockCount: lowStock,
        totalSales: totalRevenue,
      });
    } catch (e) {
      console.error("Stats load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // اتصال مستقیم به کانال Realtime CDC سوپابیس برای به‌روزرسانی بدون رفرش
    const ordersChannel = supabase
      .channel("realtime-dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadStats();
      })
      .subscribe();

    const prodsChannel = supabase
      .channel("realtime-dashboard-prods")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(prodsChannel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans select-none text-xs" dir="rtl">
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group hover:border-[var(--accent-blue)] transition">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>کاتالوگ فعال کالاها</span>
          <span className="p-2 rounded-2xl bg-blue-500/10 text-blue-500 text-sm">📦</span>
        </div>
        <div className="text-2xl font-black font-mono text-blue-500">
          {loading ? "..." : stats.totalProducts} <span className="text-xs font-bold text-[var(--text-secondary)]">قلم کالا</span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-medium block">متصل به پایگاه داده زنده</span>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group hover:border-[var(--accent-blue)] transition">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>فاکتورها و سفارش‌ها</span>
          <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500 text-sm">📄</span>
        </div>
        <div className="text-2xl font-black font-mono text-indigo-500">
          {loading ? "..." : stats.activeOrders} <span className="text-xs font-bold text-[var(--text-secondary)]">فاکتور</span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-medium block">به‌روزرسانی وب‌سوکت بلادرنگ</span>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group hover:border-amber-500 transition">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>موجودی بحرانی انبار</span>
          <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 text-sm">⚠️</span>
        </div>
        <div className="text-2xl font-black font-mono text-amber-500">
          {loading ? "..." : stats.lowStockCount} <span className="text-xs font-bold text-[var(--text-secondary)]">کالا</span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-medium block">کمتر از ۳ عدد در انبار</span>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>مجموع تراکنش‌های موفق</span>
          <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 text-sm">💳</span>
        </div>
        <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
          {loading ? "..." : stats.totalSales.toLocaleString("fa-IR")} <span className="text-xs font-bold">تومان</span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-medium block">کل حجم ناخالص فروش</span>
      </div>
    </div>
  );
}
