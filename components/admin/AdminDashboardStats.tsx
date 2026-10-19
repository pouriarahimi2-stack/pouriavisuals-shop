// File Path: components/admin/AdminDashboardStats.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";

interface SourceStat { views: number; sharePercent: number; }
interface SourceStats {
  totalViews: number;
  google:   SourceStat;
  torob:    SourceStat;
  direct:   SourceStat;
  referral: SourceStat;
}

export default function AdminDashboardStats() {
  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalSales: 0,
    inventoryValuation: 0, lowStockCount: 0, unreadMessages: 0,
    totalCustomers: 0, vipCustomersCount: 0, totalPosts: 0,
    totalNews: 0, activeCoupons: 0,
  });
  const [recentOrders, setRecentOrders]   = useState<any[]>([]);
  const [latestBackupNum, setLatestBackupNum] = useState<number>(101);
  const [loading, setLoading]             = useState(true);
  const [sourceStats, setSourceStats]     = useState<SourceStats | null>(null);
  const [deviceStats, setDeviceStats]     = useState<any>(null);

  const fetchLiveStats = async () => {
    try {
      const [res, bkpRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/dashboard-stats", { cache: "no-store" }),
        fetch("/api/cron/backup", { cache: "no-store" }).catch(() => null),
        fetch("/api/analytics/device",  { cache: "no-store" }).catch(() => null),
      ]);
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        setRecentOrders(json.recentOrders || []);
      }
      if (bkpRes && bkpRes.ok) {
        const bJson = await bkpRes.json();
        if (bJson.backupNumber) setLatestBackupNum(Number(bJson.backupNumber));
      }
      if (analyticsRes && analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        if (aJson.sources) setSourceStats(aJson.sources);
        if (aJson.stats)   setDeviceStats(aJson.stats);
      }
    } catch (e) { console.error("Dashboard stats error:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLiveStats();

    const chOrders = supabase.channel("live-dash-orders-cdc")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchLiveStats)
      .subscribe();
    const chProds = supabase.channel("live-dash-prods-cdc")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchLiveStats)
      .subscribe();
    const chMsgs = supabase.channel("live-dash-msgs-cdc")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, fetchLiveStats)
      .subscribe();

    return () => {
      supabase.removeChannel(chOrders);
      supabase.removeChannel(chProds);
      supabase.removeChannel(chMsgs);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">پرداخت شده ✓</span>;
      case "shipped":   return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">تحویل به پست 🚚</span>;
      case "delivered": return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/30">تحویل شده</span>;
      case "cancelled": return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">لغو شده</span>;
      default:          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">در انتظار</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      {/* سربرگ */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">📊</div>
          <div>
            <h2 className="text-base sm:text-lg font-black">داشبورد تحلیلی هوشمند و مرکز فرماندهی بلادرنگ آکسون</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              پایش بلادرنگ دیتابیس با وب‌سوکت CDC و پشتیبان‌گیری خودکار روزانه (#{latestBackupNum})
            </p>
          </div>
        </div>
        <button onClick={() => { soundEngine.playClick(); fetchLiveStats(); }}
          className="px-5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-sm">
          <span>🔄</span><span>استعلام لحظه‌ای</span>
        </button>
      </div>

      {/* ۱. شاخص‌های اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm hover:border-emerald-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>گردش مالی و فروش کل</span>
            <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 text-sm">💳</span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
            {loading ? "..." : formatPrice(stats.totalSales)} <span className="text-xs font-normal">تومان</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">تراکنش‌های تاییدشده در دیتابیس</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm hover:border-indigo-500 transition">
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

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm hover:border-amber-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>موجودی بحرانی انبار</span>
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 text-sm">⚠️</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-500">
            {loading ? "..." : stats.lowStockCount} <span className="text-xs font-bold text-[var(--text-secondary)]">کالا</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">کالاهای با موجودی کمتر از حد بحرانی</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2 shadow-sm hover:border-rose-500 transition">
          <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold">
            <span>پیام‌های خوانده‌نشده</span>
            <span className="p-2 rounded-2xl bg-rose-500/10 text-rose-500 text-sm">💬</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {loading ? "..." : stats.unreadMessages}
          </div>
          <Link href="/admin/messages" className="text-[10px] text-rose-400 font-bold block hover:underline">
            مشاهده پیام‌ها →
          </Link>
        </div>
      </div>

      {/* ─── ۲. مانیتورینگ منبع ترافیک ─── */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 text-base">🔎</span>
          <h3 className="font-black text-sm text-blue-400">مانیتورینگ منبع ترافیک ورودی</h3>
          <span className="mr-auto text-[10px] text-[var(--text-secondary)]">
            ${sourceStats ? sourceStats.totalViews.toLocaleString("fa-IR") + " بازدید کل" : "در حال بارگذاری..."}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "google",   label: "گوگل / جستجو", icon: "🔍", color: "blue" },
            { key: "torob",    label: "ترب",           icon: "🛒", color: "orange" },
            { key: "direct",   label: "مستقیم",        icon: "🔗", color: "emerald" },
            { key: "referral", label: "ارجاع دیگر",    icon: "↗️", color: "purple" },
          ].map(({ key, label, icon, color }) => {
            const s = sourceStats?.[key as keyof SourceStats] as SourceStat | undefined;
            const pct = s?.sharePercent ?? 0;
            const colorMap: Record<string, string> = {
              blue:    "bg-blue-500/10 text-blue-400 border-blue-500/30",
              orange:  "bg-orange-500/10 text-orange-400 border-orange-500/30",
              emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
              purple:  "bg-purple-500/10 text-purple-400 border-purple-500/30",
            };
            const barMap: Record<string, string> = {
              blue: "bg-blue-500", orange: "bg-orange-500",
              emerald: "bg-emerald-500", purple: "bg-purple-500",
            };
            return (
              <div key={key} className={"p-4 rounded-2xl border space-y-2 " + colorMap[color]}>
                <div className="flex items-center gap-1.5 font-black">
                  <span>{icon}</span><span>{label}</span>
                </div>
                <div className="text-2xl font-black font-mono">{pct}٪</div>
                <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div className={"h-full rounded-full transition-all " + barMap[color]} style={{ width: pct + "%" }} />
                </div>
                <div className="text-[10px] opacity-70">{(s?.views ?? 0).toLocaleString("fa-IR")} بازدید</div>
              </div>
            );
          })}
        </div>

        {/* device breakdown */}
        {deviceStats && (
          <div className="pt-4 border-t border-[var(--card-border)] space-y-3">
            <h4 className="font-black text-xs text-[var(--text-secondary)]">توزیع بر اساس دستگاه:</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "mobile",  label: "موبایل",  icon: "📱" },
                { key: "desktop", label: "دسکتاپ",  icon: "🖥️" },
                { key: "tablet",  label: "تبلت",    icon: "📟" },
              ].map(({ key, label, icon }) => {
                const d = deviceStats[key as "mobile" | "desktop" | "tablet"];
                return (
                  <div key={key} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
                    <div className="text-lg">{icon}</div>
                    <div className="font-black text-sm">{d?.sharePercent ?? 0}٪</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── ۳. سفارش‌های اخیر ─── */}
      {recentOrders.length > 0 && (
        <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            🕐 آخرین سفارش‌های ثبت‌شده
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentOrders.slice(0, 8).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-[var(--accent-blue)]">#{String(o.id).slice(-6).toUpperCase()}</span>
                  <span className="text-[var(--text-secondary)] truncate max-w-[120px]">{o.customer_name || "مشتری"}</span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(o.status || "pending")}
                  <span className="font-mono font-black text-emerald-500">
                    {formatPrice(o.final_amount || o.total_amount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/orders" className="block text-center text-xs font-bold text-blue-400 hover:underline pt-1">
            مشاهده همه سفارش‌ها →
          </Link>
        </div>
      )}
    </div>
  );
}
