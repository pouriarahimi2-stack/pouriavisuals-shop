"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Package, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  ArrowLeft, 
  Boxes, 
  Clock, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    recentOrders: [] as any[],
    recentProducts: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, ordRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders")
      ]);

      const prodData = await prodRes.json();
      const ordData = await ordRes.json();

      const products = prodData.products || [];
      const orders = ordData.orders || [];

      const totalRev = orders
        .filter((o: any) => o.payment_status === "paid" || o.payment_status === "shipped")
        .reduce((sum: number, o: any) => sum + (Number(o.total_price) || 0), 0);

      const pending = orders.filter((o: any) => o.payment_status === "pending").length;

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: pending,
        totalRevenue: totalRev,
        recentOrders: orders.slice(0, 5),
        recentProducts: products.slice(0, 4),
      });
    } catch (e) {
      console.error("خطا در واکشی آمار داشبورد:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    if (supabaseBrowser && typeof supabaseBrowser.channel === "function") {
      const client = supabaseBrowser;
      const channel = client
        .channel("admin-dashboard-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchDashboardData())
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchDashboardData())
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 lg:p-10 dir-rtl">
      {/* هدر پیشخوان */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-white">
            <TrendingUp size={24} className="text-[#0071e3]" />
            پیشخوان تحلیل و مدیریت آکسون
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            دیده‌بانی بلادرنگ شاخص‌های فروش، پردازش سفارشات و تنوع کاتالوگ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-xs font-bold flex items-center gap-2"
          >
            مشاهده فروشگاه
            <ArrowLeft size={16} />
          </Link>
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold shadow-lg flex items-center gap-2"
          >
            کاتالوگ محصولات
          </Link>
        </div>
      </div>

      {/* کارت‌های شاخص عملکرد (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[var(--text-secondary)] font-bold">مجموع درآمد تاییدشده</span>
            <div className="text-xl font-black text-emerald-400 mt-2">
              {stats.totalRevenue.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[var(--text-secondary)] font-bold">تعداد کل سفارشات</span>
            <div className="text-2xl font-black text-white mt-2">{stats.totalOrders}</div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[var(--text-secondary)] font-bold">سفارشات در انتظار</span>
            <div className="text-2xl font-black text-amber-400 mt-2">{stats.pendingOrders}</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-[var(--text-secondary)] font-bold">تنوع محصولات فعال</span>
            <div className="text-2xl font-black text-white mt-2">{stats.totalProducts}</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
            <Boxes size={24} />
          </div>
        </div>
      </div>

      {/* لینک‌های ناوبری سریع به پنل‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        <Link
          href="/admin/products"
          className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[#0071e3] p-6 rounded-3xl transition group flex flex-col justify-between"
        >
          <div>
            <Boxes size={28} className="text-[#0071e3] mb-3 group-hover:scale-110 transition" />
            <h3 className="text-base font-black text-white">مدیریت محصولات و انبار</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              افزودن محصولات جدید، ویرایش قیمت‌ها، گالری چندعکسی و مشخصات فنی
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#0071e3]">
            ورود به انبار <ArrowLeft size={14} />
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-emerald-500 p-6 rounded-3xl transition group flex flex-col justify-between"
        >
          <div>
            <Package size={28} className="text-emerald-400 mb-3 group-hover:scale-110 transition" />
            <h3 className="text-base font-black text-white">سفارشات و بارنامه‌ها</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              بررسی نشانی‌های خریداران، صدور کد رهگیری پستی و وضعیت پرداخت
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-400">
            مشاهده سفارشات <ArrowLeft size={14} />
          </div>
        </Link>

        <Link
          href="/admin/reviews"
          className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-400 p-6 rounded-3xl transition group flex flex-col justify-between"
        >
          <div>
            <MessageSquare size={28} className="text-amber-400 mb-3 group-hover:scale-110 transition" />
            <h3 className="text-base font-black text-white">نظرات و دیدگاه‌ها</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              تایید، مدیریت و حذف نقدها و امتیازهای ثبت‌شده توسط کاربران
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-400">
            بررسی دیدگاه‌ها <ArrowLeft size={14} />
          </div>
        </Link>
      </div>

      {/* جداول خلاصه وضعیت */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* آخرین سفارشات ثبت شده */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] mb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-emerald-400" />
              آخرین سفارشات دریافتی
            </h3>
            <Link href="/admin/orders" className="text-xs text-[#0071e3] font-bold hover:underline">
              مشاهده همه
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center font-bold">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((ord: any) => (
                <div key={ord.id} className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{ord.customer_name}</span>
                    <span className="text-[10px] text-zinc-500">{ord.order_number}</span>
                  </div>
                  <div className="text-left font-bold text-emerald-400">
                    {Number(ord.total_price || 0).toLocaleString("fa-IR")} ت
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* جدیدترین کالاهای کاتالوگ */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] mb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Boxes size={18} className="text-[#0071e3]" />
              جدیدترین کالاهای موجود
            </h3>
            <Link href="/admin/products" className="text-xs text-[#0071e3] font-bold hover:underline">
              انبار کالا
            </Link>
          </div>

          {stats.recentProducts.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center font-bold">کالایی در انبار یافت نشد.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentProducts.map((p: any) => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <img src={p.image_url || "/placeholder.png"} alt={p.title} className="w-10 h-10 object-contain rounded-xl bg-black/30 p-1" />
                    <span className="font-bold text-white truncate max-w-[200px]">{p.title || p.name}</span>
                  </div>
                  <span className="font-bold text-zinc-300 whitespace-nowrap">
                    {Number(p.price || 0).toLocaleString("fa-IR")} ت
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
