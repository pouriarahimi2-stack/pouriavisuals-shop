"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    lowStockCount: 0,
    totalSales: 0,
    unreadMessages: 0,
    totalPosts: 0,
  });

  const loadStats = async () => {
    try {
      const [prodsRes, ordersRes, msgsRes, postsRes] = await Promise.all([
        supabase.from("products").select("id, price, discount_price, stock"),
        supabase.from("orders").select("id, total_amount, status"),
        supabase.from("contact_messages").select("id, is_read"),
        supabase.from("posts").select("id"),
      ]);

      const prods = prodsRes.data || [];
      const orders = ordersRes.data || [];
      const msgs = msgsRes.data || [];
      const posts = postsRes.data || [];

      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const lowStock = prods.filter((p) => (p.stock || 0) < 3).length;
      const unreadMsgs = msgs.filter((m) => !m.is_read).length;

      setStats({
        totalProducts: prods.length,
        activeOrders: orders.length,
        lowStockCount: lowStock,
        totalSales: totalRevenue,
        unreadMessages: unreadMsgs,
        totalPosts: posts.length,
      });
    } catch (e) {
      console.error("Error loading realtime dashboard stats:", e);
    }
  };

  useEffect(() => {
    loadStats();

    // اتصال وب‌سوکت زنده برای به‌روزرسانی کارت‌ها بدون رفرش
    const channel = supabase
      .channel("dashboard-stats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans select-none text-xs">
      {/* ۱. کارت کاتالوگ محصولات */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>کاتالوگ کالاها</span>
          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 text-sm">📦</span>
        </div>
        <div className="text-2xl font-black font-mono text-blue-500">
          {stats.totalProducts} <span className="text-xs font-bold text-[var(--text-secondary)]">قلم</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-medium block">کالاهای ثبت‌شده در ویترین اصلی</span>
      </div>

      {/* ۲. کارت سفارشات و فاکتورها */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>فاکتورها و سفارش‌ها</span>
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-sm">📄</span>
        </div>
        <div className="text-2xl font-black font-mono text-indigo-500">
          {stats.activeOrders} <span className="text-xs font-bold text-[var(--text-secondary)]">عدد</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-medium block">کل سفارشات ثبت‌شده مشتریان</span>
      </div>

      {/* ۳. کارت موجودی بحرانی انبار */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>موجودی بحرانی انبار</span>
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-sm">⚠️</span>
        </div>
        <div className="text-2xl font-black font-mono text-amber-500">
          {stats.lowStockCount} <span className="text-xs font-bold text-[var(--text-secondary)]">کالا</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-medium block">تیراژ کمتر از ۳ عدد موجود در انبار</span>
      </div>

      {/* ۴. کارت مجموع فروش و تراکنش‌ها */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
          <span>مجموع تراکنش‌های موفق</span>
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">💳</span>
        </div>
        <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
          {stats.totalSales.toLocaleString("fa-IR")} <span className="text-xs font-bold">ت</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-medium block">فروش خالص تسویه‌شده</span>
      </div>
    </div>
  );
}