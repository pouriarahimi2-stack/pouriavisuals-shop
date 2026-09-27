"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, Users, Tag, FileText, RefreshCw, Package, Shield, Database, Paintbrush, MessageSquare, BarChart3 } from "lucide-react";

interface Stats {
  totalProducts: number; totalOrders: number; pendingOrders: number; totalSales: number;
  inventoryValuation: number; lowStockCount: number; unreadMessages: number;
  totalCustomers: number; vipCustomersCount: number; totalPosts: number;
  totalNews: number; activeCoupons: number; lastAutoBackup?: string;
}
interface Order { id: string; customerName: string; phone: string; amount: number; status: string; date: string; }

const STATUS: Record<string, {label:string;color:string}> = {
  pending:               {label:"در انتظار",    color:"text-amber-400 bg-amber-400/10 border-amber-400/20"},
  paid:                  {label:"پرداخت‌شده",  color:"text-emerald-400 bg-emerald-400/10 border-emerald-400/20"},
  processing:            {label:"پردازش",       color:"text-blue-400 bg-blue-400/10 border-blue-400/20"},
  shipped:               {label:"ارسال‌شده",   color:"text-purple-400 bg-purple-400/10 border-purple-400/20"},
  delivered:             {label:"تحویل",        color:"text-emerald-500 bg-emerald-500/10 border-emerald-500/20"},
  cancelled:             {label:"لغو",          color:"text-rose-400 bg-rose-400/10 border-rose-400/20"},
  pending_manual_review: {label:"در انتظار",    color:"text-amber-400 bg-amber-400/10 border-amber-400/20"},
};

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<Stats|null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null);
  const [lastBackup, setLastBackup] = useState<string|null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res  = await fetch("/api/admin/dashboard-stats", { cache: "no-store" });
      const data = await res.json();
      if (data.success) { setStats(data.stats); setOrders(data.recentOrders || []); setLastUpdate(new Date()); }
      else setError(data.message || "خطا در دریافت آمار");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchBackupStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/backup?stats=true");
      const d = await r.json();
      if (d.success && d.lastBackup) setLastBackup(d.lastBackup);
    } catch {}
  }, []);

  const handleBackupNow = async () => {
    if (!confirm("آیا از ایجاد پشتیبان الان اطمینان دارید؟")) return;
    soundEngine.playClick(); setBackingUp(true);
    try {
      const res  = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error("خطا");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "axon-backup-" + new Date().toISOString().slice(0,10) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setLastBackup(new Date().toISOString());
      soundEngine.playSuccess?.();
    } catch { alert("خطا در دریافت پشتیبان"); }
    finally { setBackingUp(false); }
  };

  useEffect(() => { fetchDashboard(); fetchBackupStatus(); }, [fetchDashboard, fetchBackupStatus]);

  const kpis = stats ? [
    {icon:<TrendingUp  size={20}/>,color:"text-emerald-400",title:"مجموع فروش",    value:stats.totalSales>0?stats.totalSales.toLocaleString("fa-IR")+" ت":"۰",sub:"فاکتورهای تأیید‌شده"},
    {icon:<ShoppingBag size={20}/>,color:"text-blue-400",   title:"کل سفارشات",   value:stats.totalOrders.toLocaleString("fa-IR"),sub:"حجم تعاملات"},
    {icon:<Clock       size={20}/>,color:"text-amber-400",  title:"در انتظار",    value:stats.pendingOrders.toLocaleString("fa-IR"),sub:"نیاز به بررسی"},
    {icon:<AlertTriangle size={20}/>,color:"text-rose-400", title:"کسری انبار",  value:stats.lowStockCount.toLocaleString("fa-IR"),sub:"موجودی < ۳"},
    {icon:<Package     size={20}/>,color:"text-purple-400", title:"محصولات",      value:stats.totalProducts.toLocaleString("fa-IR"),sub:"در کاتالوگ"},
    {icon:<Users       size={20}/>,color:"text-cyan-400",   title:"مشتریان",      value:stats.totalCustomers.toLocaleString("fa-IR"),sub:(stats.vipCustomersCount||0)+" VIP"},
    {icon:<Tag         size={20}/>,color:"text-orange-400", title:"تخفیف فعال",  value:stats.activeCoupons.toLocaleString("fa-IR"),sub:"کد قابل استفاده"},
    {icon:<FileText    size={20}/>,color:"text-indigo-400", title:"محتوا",        value:((stats.totalPosts||0)+(stats.totalNews||0)).toLocaleString("fa-IR"),sub:"مقاله و خبر"},
  ] : [];

  const quick = [
    {href:"/admin/appearance",emoji:"🎨",label:"استودیوی ظاهر",   color:"hover:border-blue-500"},
    {href:"/admin/messages",  emoji:"💬",label:"پیام‌های مشتریان",color:"hover:border-emerald-500"},
    {href:"/admin/backup",    emoji:"💾",label:"پشتیبان‌گیری",    color:"hover:border-purple-500"},
    {href:"/admin/audit-logs",emoji:"🔒",label:"لاگ‌های امنیتی", color:"hover:border-rose-500"},
  ];

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)]" dir="rtl">
      {/* هدر */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <BarChart3 size={22}/> داشبورد آکسون کور
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            آمار فروش، سفارشات و انبار
            {lastUpdate && <span className="mr-2 text-emerald-500">· {lastUpdate.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products" className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:bg-[var(--card-border)] transition">➕ محصول</Link>
          <Link href="/admin/financial" className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:bg-[var(--card-border)] transition">📦 سفارشات</Link>
          <button onClick={handleBackupNow} disabled={backingUp}
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:bg-[var(--card-border)] transition disabled:opacity-50 cursor-pointer">
            {backingUp ? "⏳" : "💾"} پشتیبان
          </button>
          <button onClick={() => { soundEngine.playClick(); fetchDashboard(); }}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow">
            <RefreshCw size={14} className={loading?"animate-spin":""}/> به‌روزرسانی
          </button>
        </div>
      </div>

      {/* وضعیت بکاپ */}
      {lastBackup && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 flex items-center gap-2">
          <span>💾</span>
          <span>آخرین پشتیبان‌گیری: {new Date(lastBackup).toLocaleString("fa-IR")}</span>
          <Link href="/admin/backup" className="mr-auto text-[var(--accent-blue)] hover:underline">مدیریت ←</Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
          ⚠️ {error} <button onClick={fetchDashboard} className="mr-3 underline">تلاش مجدد</button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {loading ? Array.from({length:8}).map((_,i) => (
          <div key={i} className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-[var(--card-border)]"/>
            <div className="h-3 w-16 rounded bg-[var(--card-border)]"/>
            <div className="h-5 w-24 rounded bg-[var(--card-border)]"/>
          </div>
        )) : kpis.map((k,i) => (
          <div key={i} className="p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-md space-y-2 hover:shadow-lg transition">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${k.color}`}>{k.icon}</div>
            <div className="text-[11px] text-[var(--text-secondary)] font-bold">{k.title}</div>
            <div className={`text-base font-black font-mono ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-slate-400">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* آخرین سفارشات */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h2 className="text-sm font-black flex items-center gap-2">🛍️ آخرین سفارشات</h2>
          <Link href="/admin/financial" className="text-[11px] text-[var(--accent-blue)] hover:underline font-bold">همه ←</Link>
        </div>
        {loading ? <div className="text-center py-8 text-xs text-slate-400">در حال بارگذاری...</div>
        : orders.length === 0 ? <div className="text-center py-8 text-xs text-slate-400">سفارشی ثبت نشده.</div>
        : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)]">
            <table className="w-full text-xs min-w-[500px]">
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
                {orders.map(o => {
                  const s = STATUS[o.status] || {label:o.status,color:"text-slate-400 bg-slate-400/10 border-slate-400/20"};
                  return (
                    <tr key={o.id} className="hover:bg-[var(--card-hover)] transition">
                      <td className="py-2.5 px-3 font-bold truncate max-w-[100px]">{o.customerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 hidden sm:table-cell">{o.phone}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{Number(o.amount).toLocaleString("fa-IR")} ت</td>
                      <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.color}`}>{s.label}</span></td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono hidden md:table-cell">{new Date(o.date).toLocaleDateString("fa-IR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* میانبرها */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quick.map(q => (
          <Link key={q.href} href={q.href}
            className={`p-4 sm:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center font-bold text-xs ${q.color} hover:border-opacity-100 transition space-y-2 flex flex-col items-center cursor-pointer`}>
            <span className="text-2xl">{q.emoji}</span>
            <span>{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
