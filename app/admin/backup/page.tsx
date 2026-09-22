"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Upload, Database, RefreshCw, CheckCircle, AlertTriangle, Shield, FileJson } from "lucide-react";

const TABLE_LABELS: Record<string, string> = {
  site_info:       "تنظیمات سایت",
  products:        "محصولات",
  orders:          "سفارشات",
  users:           "کاربران",
  coupons:         "کدهای تخفیف",
  tech_news:       "اخبار فناوری",
  blog_posts:      "مقالات",
  product_reviews: "دیدگاه‌ها",
  messages:        "پیام‌های تماس",
};

interface TableStats { [table: string]: number }
interface RestoreResult { restored: number; errors: string[] }

export default function AdminBackupPage() {
  const [downloading,    setDownloading]    = useState(false);
  const [restoring,      setRestoring]      = useState(false);
  const [stats,          setStats]          = useState<TableStats | null>(null);
  const [loadingStats,   setLoadingStats]   = useState(true);
  const [statusMsg,      setStatusMsg]      = useState<{ type: "success"|"error"|"warning"; text: string } | null>(null);
  const [restoreResults, setRestoreResults] = useState<Record<string, RestoreResult> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/admin/backup?stats=true");
      const d   = await res.json();
      if (d.success) setStats(d.stats);
    } catch {}
    finally { setLoadingStats(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const totalRecords = stats ? Object.values(stats).reduce((s, c) => s + c, 0) : 0;

  // ── دانلود پشتیبان ─────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true); setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `خطای ${res.status}`);
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      const today    = new Date().toISOString().slice(0, 10);
      a.href         = url;
      a.download     = `axon-backup-${today}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: "success", text: "✓ فایل پشتیبان با موفقیت دانلود شد و در دفتر کل امنیتی ثبت گردید." });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally { setDownloading(false); }
  };

  // ── بازیابی از فایل ───────────────────────────────────────────
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setStatusMsg({ type: "error", text: "فقط فایل‌های .json پشتیبان آکسون کور قابل بازیابی هستند." });
      return;
    }

    const confirmed = window.confirm(
      "⚠️ بازیابی داده‌ها، رکوردهای موجود در دیتابیس را با داده‌های فایل پشتیبان جایگزین می‌کند.\n\nآیا مطمئن هستید؟"
    );
    if (!confirmed) { e.target.value = ""; return; }

    setRestoring(true); setStatusMsg(null); setRestoreResults(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res  = await fetch("/api/admin/backup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(json),
      });
      const data = await res.json();

      if (data.success) {
        setRestoreResults(data.results);
        setStatusMsg({ type: "success", text: data.message });
        fetchStats();
      } else {
        setStatusMsg({ type: "error", text: data.message || "خطا در فرآیند بازیابی." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "خطا در خواندن فایل: " + err.message });
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-4xl" dir="rtl">

      {/* ── هدر ────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <Database size={22} /> مرکز پشتیبان‌گیری و بازیابی داده‌ها
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            دانلود اسنپ‌شات کامل دیتابیس یا بازیابی از فایل پشتیبان قبلی
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold flex items-center gap-2 hover:bg-[var(--card-hover)] transition"
        >
          <RefreshCw size={14} className={loadingStats ? "animate-spin" : ""} /> بروزرسانی آمار
        </button>
      </div>

      {/* ── پیام وضعیت ──────────────────────────────────────────── */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
          statusMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
          statusMsg.type === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                         "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          {statusMsg.type === "success" ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
          {statusMsg.text}
        </div>
      )}

      {/* ── آمار جداول ──────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h2 className="text-sm font-black flex items-center gap-2">
            <FileJson size={16} className="text-[var(--accent-blue)]" /> وضعیت فعلی پایگاه داده
          </h2>
          <span className="text-xs font-bold text-[var(--text-secondary)]">
            مجموع: <span className="text-[var(--accent-blue)] font-mono">{totalRecords.toLocaleString("fa-IR")}</span> رکورد
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(TABLE_LABELS).map(([table, label]) => (
            <div key={table} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)]">{label}</span>
              <span className="font-mono font-black text-sm text-[var(--accent-blue)]">
                {loadingStats ? "..." : (stats?.[table] ?? 0).toLocaleString("fa-IR")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── کارت‌های اقدام ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* دانلود پشتیبان */}
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Download size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black">دانلود پشتیبان کامل</h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">فایل JSON شامل تمام جداول</p>
            </div>
          </div>
          <div className="space-y-2 text-[11px] text-[var(--text-secondary)] font-medium">
            {["محصولات، سفارشات، کاربران", "تنظیمات سایت و بنرها", "مقالات، اخبار، دیدگاه‌ها", "کدهای تخفیف و پیام‌ها"].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-emerald-400 font-black">✓</span> {item}
              </div>
            ))}
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download size={15} />
            {downloading ? "در حال ساخت اسنپ‌شات..." : "دریافت فایل پشتیبان (.json)"}
          </button>
        </div>

        {/* بازیابی از فایل */}
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-rose-500/20 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Upload size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black">بازیابی از فایل پشتیبان</h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">آپلود فایل JSON و Upsert به DB</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 font-bold flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            داده‌های موجود با Upsert جایگزین می‌شوند. قبل از بازیابی، ابتدا پشتیبان جدید بگیرید.
          </div>
          <label className={`w-full py-3 rounded-2xl border-2 border-dashed text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            restoring
              ? "border-[var(--card-border)] text-slate-500 opacity-50"
              : "border-rose-500/40 text-rose-400 hover:border-rose-400 hover:bg-rose-500/5"
          }`}>
            <Upload size={15} />
            {restoring ? "در حال بازیابی..." : "انتخاب فایل axon-backup-*.json"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              disabled={restoring}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ── نتایج بازیابی ───────────────────────────────────────── */}
      {restoreResults && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
          <h3 className="text-sm font-black border-b border-[var(--card-border)] pb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" /> نتایج بازیابی جدول‌به‌جدول
          </h3>
          <div className="space-y-2">
            {Object.entries(restoreResults).map(([table, result]) => (
              <div key={table} className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                result.errors.length > 0
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-emerald-500/20 bg-emerald-500/5"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={result.errors.length > 0 ? "text-amber-400" : "text-emerald-400"}>
                    {result.errors.length > 0 ? "⚠️" : "✓"}
                  </span>
                  <span className="font-bold">{TABLE_LABELS[table] || table}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[var(--accent-blue)]">{result.restored} رکورد</span>
                  {result.errors.length > 0 && (
                    <span className="text-amber-400 mr-2">({result.errors.length} خطا)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── امنیت ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Shield     size={18} />, color: "text-emerald-400 bg-emerald-400/10", title: "احراز هویت RBAC",       desc: "فقط superadmin دسترسی دارد" },
          { icon: <FileJson   size={18} />, color: "text-blue-400    bg-blue-400/10",    title: "فرمت JSON استاندارد",   desc: "قابل ایمپورت مستقیم به Supabase" },
          { icon: <Database   size={18} />, color: "text-purple-400  bg-purple-400/10",  title: "Upsert ایمن",           desc: "بدون حذف رکوردهای موجود" },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>{item.icon}</div>
            <div>
              <div className="text-xs font-black">{item.title}</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
