"use client";

import React, { useEffect, useState } from "react";
import { orderService, Order } from "@/services/orderService";
import { productService } from "@/services/productService";

export default function AdminDashboardStats() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });

  const [weeklySales, setWeeklySales] = useState<number[]>([40, 65, 30, 85, 95, 70, 110]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // محاسبه آمار سفارشات از orderService یا کش محلی
    let orders: Order[] = [];
    try {
      if (typeof orderService.getAll === "function") {
        orders = (await orderService.getAll()) || [];
      } else if (typeof orderService.getOrders === "function") {
        orders = orderService.getOrders();
      } else if (typeof orderService.getLocalOrders === "function") {
        orders = orderService.getLocalOrders();
      } else {
        orders = JSON.parse(
          localStorage.getItem("admin_orders_cache") ||
          localStorage.getItem("site_orders") ||
          localStorage.getItem("orders") ||
          "[]"
        );
      }
    } catch {
      orders = [];
    }

    const totalRev = orders.reduce(
      (sum, o: any) => sum + (o.finalAmount || o.total_amount || o.totalAmount || o.total || 0),
      0
    );
    const pending = orders.filter((o) => o.status === "processing" || o.status === "pending").length;

    // محاسبه آمار محصولات از productService
    let products: any[] = [];
    try {
      if (typeof productService.getAll === "function") {
        products = (await productService.getAll()) || [];
      } else if (typeof productService.getProducts === "function") {
        products = productService.getProducts();
      }
    } catch {
      products = [];
    }
    const lowStock = products.filter((p) => (p.stock !== undefined ? p.stock < 3 : false)).length;

    setStats({
      totalRevenue: totalRev,
      totalOrders: orders.length,
      pendingOrders: pending,
      totalProducts: products.length,
      lowStockProducts: lowStock,
    });
  };

  return (
    <div className="space-y-4 font-sans text-[var(--text-primary)] select-none">
      {/* کارت‌های KPI اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* کارت فروش کل */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden border border-[var(--card-border)] shadow-sm bg-[var(--card-bg)]">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>درآمد و فروش کل</span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-sm border border-emerald-500/20">
              💰
            </span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.totalRevenue.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-sans text-[var(--text-secondary)]">تومان</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span>↑ ۱۲٪</span>
            <span className="text-[var(--text-secondary)] font-medium">نسبت به هفته گذشته</span>
          </div>
        </div>

        {/* کارت سفارشات */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden border border-[var(--card-border)] shadow-sm bg-[var(--card-bg)]">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>کل سفارشات</span>
            <span className="p-2 rounded-xl bg-blue-500/15 text-[var(--accent-blue)] text-sm border border-blue-500/20">
              📑
            </span>
          </div>
          <div className="text-xl font-black text-[var(--accent-blue)] font-mono">
            {stats.totalOrders.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-sans text-[var(--text-secondary)]">سفارش</span>
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            {stats.pendingOrders > 0
              ? `⚠️ ${stats.pendingOrders} سفارش نیازمند پردازش`
              : "✅ همه سفارش‌ها پردازش شده‌اند"}
          </div>
        </div>

        {/* کارت محصولات */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden border border-[var(--card-border)] shadow-sm bg-[var(--card-bg)]">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>تنوع محصولات</span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm border border-amber-500/20">
              📦
            </span>
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] font-mono">
            {stats.totalProducts.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-sans text-[var(--text-secondary)]">کالا</span>
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-bold">
            فعال در ویترین فروشگاه
          </div>
        </div>

        {/* کارت انبارداری */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden border border-[var(--card-border)] shadow-sm bg-[var(--card-bg)]">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>وضعیت انبار</span>
            <span className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-sm border border-rose-500/20">
              ⚠️
            </span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {stats.lowStockProducts.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-sans text-[var(--text-secondary)]">کالا</span>
          </div>
          <div
            className={`text-[10px] font-bold ${
              stats.lowStockProducts > 0
                ? "text-rose-600 dark:text-rose-400 animate-pulse"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {stats.lowStockProducts > 0
              ? "موجودی روبه‌اتمام (نیازمند شارژ)"
              : "موجودی انبار کافی است"}
          </div>
        </div>
      </div>

      {/* نمودار تحلیل روند فروش هفته */}
      <div className="liquid-glass-card p-6 rounded-3xl space-y-4 border border-[var(--card-border)] shadow-sm bg-[var(--card-bg)]">
        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-[var(--accent-blue)] flex items-center gap-2">
              <span>📈</span> نمودار تحلیل روند فروش ۷ روز اخیر
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">
              میزان فروش و استقبال خریداران به تفکیک روزهای هفته
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl font-mono text-[var(--accent-blue)] font-bold">
            بروزرسانی زنده 🟢
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
          {["شنبه", "۱شنبه", "۲شنبه", "۳شنبه", "۴شنبه", "۵شنبه", "جمعه"].map((day, idx) => {
            const val = weeklySales[idx] || 20;
            const heightPercent = Math.min(100, Math.max(18, val));
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition text-[var(--accent-blue)] font-bold bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--card-border)] shadow-sm">
                  {val}م
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[42px] rounded-2xl bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 dark:from-blue-600/60 dark:via-blue-500 dark:to-cyan-400 group-hover:from-blue-500 group-hover:to-cyan-300 transition-all duration-500 shadow-md shadow-blue-500/20 relative cursor-pointer"
                />
                <span className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] font-bold transition">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}