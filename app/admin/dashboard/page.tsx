"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import {
  TrendingUp, ShoppingBag, Clock, AlertTriangle, Users,
  Tag, FileText, RefreshCw, BarChart3, Package
} from "lucide-react";

interface DashboardStats {
  totalProducts:      number;
  totalOrders:        number;
  pendingOrders:      number;
  totalSales:         number;
  inventoryValuation: number;
  lowStockCount:      number;
  unreadMessages:     number;
  totalCustomers:     number;
  vipCustomersCount:  number;
  totalPosts:         number;
  totalNews:          number;
  activeCoupons:      number;
}

interface RecentOrder {
  id:           string;
  customerName: string;
  phone:        string;
  amount:       number;
  status:       string;
  date:         string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:              { label: "در انتظار",    color: "text-amber-400   bg-amber-400/10   border-amber-400/20"   },
  pending_manual_review:{ label: "در انتظار",    color: "text-amber-400   bg-amber-400/10   border-amber-400/20"   },
  paid:                 { label: "پرداخت‌شده",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  processing:           { label: "پردازش",       color: "text-blue-400    bg-blue-400/10    border-blue-400/20"    },
  shipped:              { label: "ارسال‌شده",    color: "text-purple-400  bg-purple-400/10  border-purple-400/20"  },
  delivered:            { label: "تحویل‌شده",   color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  cancelled:            { label: "لغو‌شده",     color: "text-rose-400    bg-rose-400/10    border-rose-400/20"    },
};

export default function AdminDashboardPage() {
  const [stats,        setStats]        = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);
  const [error,        setError]        = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/dashboard-stats", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `خطای سرور ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setLastUpdate(new Date());
      }
    } catch (e: any) {
      setError(e.message || "خطا در دریافت آمار داشبورد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const kpis = stats ? [
    {
      icon: <TrendingUp  size={20} />, color: "text-emerald-400",
      title: "مجموع فروش",
      value: stats.totalSales > 0 ? `${stats.totalSales.toLocaleString("fa-IR")} ت` : "۰ تومان",
      sub:   "فاکتورهای پرداخت و تحویل",
    },
    {
      icon: <ShoppingBag size={20} />, color: "text-[var(--accent-blue)]",
      title: "کل سفارشات",
      value: `${(stats.totalOrders || 0).toLocaleString("fa-IR")} رکورد`,
      sub:   "حجم کل تعاملات فروشگاه",
    },
    {
      icon: <Clock       size={20} />, color: "text-amber-400",
      title: "در انتظار بررسی",
      value: `${(stats.pendingOrders || 0).toLocaleString("fa-IR")} سفارش`,
      sub:   "نیازمند تأیید یا پردازش",
    },
    {
      icon: <AlertTriangle size={20} />, color: "text-rose-400",
      title: "هشدار کسری انبار",
      value: `${(stats.lowStockCount || 0).toLocaleString("fa-IR")} قلم`,
      sub:   "موجودی کمتر از ۳ عدد",
    },
    {
      icon: <Package     size={20} />, color: "text-purple-400",
      title: "کل محصولات",
      value: `${(stats.totalProducts || 0).toLocaleString("fa-IR")} کالا`,
      sub:   "موجود در کاتالوگ",
    },
    {
      icon: <Users       size={20} />, color: "text-cyan-400",
      title: "مشتریان",
      value: `${(stats.totalCustomers || 0).toLocaleString("fa-IR")} نفر`,
      sub:   `${stats.vipCustomersCount || 0} مشتری VIP`,
    },
    {
      icon: <Tag         size={20} />, color: "text-orange-400",
      title: "کدهای تخفیف فعال",
      value: `${(stats.activeCoupons || 0).toLocaleString("fa-IR")} کد`,
      sub:   "قابل استفاده در سبد خرید",
    },
    {
      icon: <FileText    size={20} />, color: "text-indigo-400",
      title: "مقالات و اخبار",
      value: `${(stats.totalPosts || 0) + (stats.totalNews || 0)} نوشته`,
      sub:   `${stats.totalPosts || 0} مقاله · ${stats.totalNews || 0} خبر`,
    },
  ] : [];

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">

      {/* ── هدر ──────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <BarChart3 size={22} /> داشبورد مدیریت آکسون کور
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            آمار فروش، سفارشات، انبار و مشتریان — همه در یک نگاه
            {lastUpdate && (
              <span className="mr-2 text-emerald-500">
                · آخرین بروزرسانی: {lastUpdate.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/products" className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold transition hover:bg-[var(--card-border)]">
            ➕ افزودن کالا
          </Link>
          <Link href="/admin/orders" className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold transition hover:bg-[var(--card-border)]">
            📦 سفارشات
          </Link>
          <Link href="/admin/backup" className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold transition hover:bg-[var(--card-border)]">
            💾 پشتیبان
          </Link>
          <button
            onClick={() => { soundEngine.playClick(); fetchDashboard(); }}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            بروزرسانی
          </button>
        </div>
      </div>

      {/* ── خطا ──────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
          ⚠️ {error}
          <button onClick={fetchDashboard} className="mr-3 underline">تلاش مجدد</button>
        </div>
      )}

      {/* ── KPI Cards — ۸ کارت آماری ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[var(--card-border)]" />
              <div className="h-3 w-16 rounded bg-[var(--card-border)]" />
              <div className="h-5 w-24 rounded bg-[var(--card-border)]" />
            </div>
          ))
        ) : (
          kpis.map((kpi, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2 hover:shadow-lg transition">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center bg-current/10 ${kpi.color}`}>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-bold">{kpi.title}</div>
              <div className={`text-base font-black font-mono ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] text-slate-400">{kpi.sub}</div>
            </div>
          ))
        )}
      </div>

      {/* ── آخرین سفارشات ─────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h2 className="text-sm font-black flex items-center gap-2">
            🛍️ آخرین سفارشات ثبت‌شده
          </h2>
          <Link href="/admin/orders" className="text-[11px] text-[var(--accent-blue)] hover:underline font-bold">
            مشاهده همه →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">در حال بارگذاری...</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">هیچ سفارشی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold">
                  <th className="py-2.5 px-3 text-right">مشتری</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">شماره</th>
                  <th className="py-2.5 px-3 text-right">مبلغ</th>
                  <th className="py-2.5 px-3 text-right">وضعیت</th>
                  <th className="py-2.5 px-3 text-right hidden md:table-cell">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {recentOrders.map((ord) => {
                  const s = STATUS_MAP[ord.status] || { label: ord.status, color: "text-slate-400 bg-slate-400/10 border-slate-400/20" };
                  return (
                    <tr key={ord.id} className="hover:bg-[var(--card-hover)] transition">
                      <td className="py-2.5 px-3 font-bold max-w-[120px] truncate">{ord.customerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 hidden sm:table-cell">{ord.phone}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {Number(ord.amount).toLocaleString("fa-IR")} ت
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono hidden md:table-cell">
                        {new Date(ord.date).toLocaleDateString("fa-IR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── میانبرهای سریع ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/storefront", emoji: "🎨", label: "استودیوی ظاهر"   },
          { href: "/admin/messages",   emoji: "💬", label: "پیام‌های مشتریان" },
          { href: "/admin/coupons",    emoji: "🏷️", label: "کدهای تخفیف"     },
          { href: "/admin/settings",   emoji: "⚙️", label: "تنظیمات عمومی"  },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center font-bold text-xs hover:bg-[var(--card-hover)] hover:border-[var(--accent-blue)] transition space-y-1.5"
          >
            <span className="text-2xl block">{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
