"use client";

import React, { useState, useEffect } from "react";
import { productService } from "@/services/productService";
import { orderService } from "@/services/orderService";

interface DashboardStatsData {
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalBlogs: number;
}

export default function AdminDashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalBlogs: 0,
  });

  const [loading, setLoading] = useState(true);

  const calculateStats = async () => {
    try {
      const [products, orders] = await Promise.all([
        productService.getAll(),
        orderService.getAll(),
      ]);

      const lowStock = products.filter((p) => (p.stock ?? 0) <= 3).length;
      const pending = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
      const revenue = orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const localBlogs = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("site_blogs") || "[]")
        : [];

      setStats({
        totalProducts: products.length,
        lowStockProducts: lowStock,
        totalOrders: orders.length,
        pendingOrders: pending,
        totalRevenue: revenue,
        totalBlogs: localBlogs.length,
      });
    } catch (e) {
      console.error("Dashboard stats calculation error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateStats();

    const handleSync = () => calculateStats();

    window.addEventListener("products_updated", handleSync);
    window.addEventListener("orders_updated", handleSync);
    window.addEventListener("coupons_updated", handleSync);

    return () => {
      window.removeEventListener("products_updated", handleSync);
      window.removeEventListener("orders_updated", handleSync);
      window.removeEventListener("coupons_updated", handleSync);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      
      {/* کارت ۱: محصولات فعال */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-bold">کاتالوگ کالاها</span>
          <span className="w-8 h-8 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] flex items-center justify-center text-sm">
            📦
          </span>
        </div>
        <div>
          <h3 className="font-mono font-black text-xl text-[var(--accent-blue)]">
            {loading ? "..." : `${stats.totalProducts} قلم`}
          </h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">محصولات ثبت‌شده در ویترین</p>
        </div>
      </div>

      {/* کارت ۲: سفارش‌ها و فاکتورها */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-bold">فاکتورها و سفارش‌ها</span>
          <span className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">
            📑
          </span>
        </div>
        <div>
          <h3 className="font-mono font-black text-xl text-purple-600 dark:text-purple-400">
            {loading ? "..." : `${stats.totalOrders} عدد`}
          </h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">
            {stats.pendingOrders} فاکتور نیازمند ارسال
          </p>
        </div>
      </div>

      {/* کارت ۳: هشدار انبارداری */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-bold">موجودی بحرانی انبار</span>
          <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-sm">
            ⚠️
          </span>
        </div>
        <div>
          <h3 className="font-mono font-black text-xl text-amber-500">
            {loading ? "..." : `${stats.lowStockProducts} کالا`}
          </h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">تیراژ کمتر از ۳ عدد</p>
        </div>
      </div>

      {/* کارت ۴: گردش مالی فروشگاه */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-bold">مجموع تراکنش‌های موفق</span>
          <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">
            💰
          </span>
        </div>
        <div>
          <h3 className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 truncate">
            {loading ? "..." : `${stats.totalRevenue.toLocaleString("fa-IR")} ت`}
          </h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">فروش خالص تسویه‌شده</p>
        </div>
      </div>
    </div>
  );
}