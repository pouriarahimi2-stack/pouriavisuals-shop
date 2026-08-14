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

  const loadDashboardData = () => {
    // محاسبه آمار سفارشات از orderService
    const orders: Order[] = orderService ? orderService.getOrders() : [];
    const totalRev = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
    const pending = orders.filter((o) => o.status === "processing" || o.status === "pending").length;

    // محاسبه آمار محصولات از productService
    const products = productService ? productService.getProducts() : [];
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
    <div className="space-y-4 font-sans text-white select-none">
      {/* کارت‌های KPI اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* کارت فروش کل */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center opacity-70 text-xs">
            <span>درآمد و فروش کل</span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm">💰</span>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {stats.totalRevenue.toLocaleString("fa-IR")} <span className="text-xs font-sans text-white/70">تومان</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 font-bold flex items-center gap-1">
            <span>↑ ۱۲٪</span>
            <span className="opacity-60">نسبت به هفته گذشته</span>
          </div>
        </div>

        {/* کارت سفارشات */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center opacity-70 text-xs">
            <span>کل سفارشات</span>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 text-sm">📑</span>
          </div>
          <div className="text-xl font-black text-indigo-300 font-mono">
            {stats.totalOrders.toLocaleString("fa-IR")} <span className="text-xs font-sans text-white/70">سفارش</span>
          </div>
          <div className="text-[10px] text-amber-400 font-bold">
            {stats.pendingOrders > 0 ? `⚠️ ${stats.pendingOrders} سفارش نیازمند پردازش` : "✅ همه سفارش‌ها پردازش شده‌اند"}
          </div>
        </div>

        {/* کارت محصولات */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center opacity-70 text-xs">
            <span>تنوع محصولات</span>
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 text-sm">📦</span>
          </div>
          <div className="text-xl font-black text-blue-300 font-mono">
            {stats.totalProducts.toLocaleString("fa-IR")} <span className="text-xs font-sans text-white/70">کالا</span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold">
            فعال در ویترین فروشگاه
          </div>
        </div>

        {/* کارت انبارداری */}
        <div className="liquid-glass-card p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center opacity-70 text-xs">
            <span>وضعیت انبار</span>
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 text-sm">⚠️</span>
          </div>
          <div className="text-xl font-black text-rose-400 font-mono">
            {stats.lowStockProducts.toLocaleString("fa-IR")} <span className="text-xs font-sans text-white/70">کالا</span>
          </div>
          <div className={`text-[10px] font-bold ${stats.lowStockProducts > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
            {stats.lowStockProducts > 0 ? "موجودی روبه‌اتمام (نیازمند شارژ)" : "موجودی انبار کافی است"}
          </div>
        </div>
      </div>

      {/* نمودار گرافیکی روند فروش هفته */}
      <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-indigo-300 flex items-center gap-2">
              <span>📈</span> نمودار تحلیل روند فروش ۷ روز اخیر
            </h4>
            <p className="text-[10px] opacity-60 mt-0.5">میزان فروش و استقبال خریداران به تفکیک روزهای هفته</p>
          </div>
          <span className="text-[10px] px-3 py-1 bg-white/5 border border-white/10 rounded-xl font-mono text-indigo-200">
            بروزرسانی زنده
          </span>
        </div>

        <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
          {["شنبه", "۱شنبه", "۲شنبه", "۳شنبه", "۴شنبه", "۵شنبه", "جمعه"].map((day, idx) => {
            const val = weeklySales[idx] || 20;
            const heightPercent = Math.min(100, Math.max(15, val));
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition text-indigo-300 font-bold">
                  {val}م
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-indigo-600/40 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all duration-300 shadow-lg shadow-indigo-500/20 relative"
                />
                <span className="text-[10px] opacity-70 font-bold">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}