// File Path: app/admin/backup/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminBackupPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [fullSnapshot, setFullSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSnapshot = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.backup) {
        setFullSnapshot(json.backup);
        setCounts(json.backup.counts || {});
      }
    } catch (e) {
      console.error("Backup load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const handleDownloadBackupJson = () => {
    if (!fullSnapshot) return;
    soundEngine.playSuccess();
    const dataStr = JSON.stringify(fullSnapshot, null, 2);
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "axoncore_full_backup_" + dateTag + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      type: "success",
      text: "✓ فایل نسخه پشتیبان کامل دیتابیس با موفقیت دانلود شد.",
    });
  };

  const handleRestoreFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClick();
    setRestoring(true);
    setFeedback(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup: parsed }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback({ type: "success", text: json.message });
        fetchSnapshot();
      } else {
        setFeedback({ type: "error", text: json.message || "خطا در بازگردانی بکاپ." });
      }
    } catch {
      setFeedback({ type: "error", text: "فایل JSON انتخاب‌شده معتبر نیست." });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>💾</span> مرکز پشتیبان‌گیری و بازگردانی کامل دیتابیس (Database Backup & Restore)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تهیه نسخه پشتیبان یکپارچه (JSON) از تمام جداول حیاتی فروشگاه و قابلیت بازگردانی مستقیم
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadBackupJson}
            disabled={loading || !fullSnapshot}
            className="flex-1 sm:flex-initial justify-center px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <span>⬇️ دانلود بکاپ کامل دیتابیس (JSON)</span>
          </button>

          <label className="flex-1 sm:flex-initial justify-center px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center gap-2">
            <span>{restoring ? "در حال بازگردانی..." : "⬆️ بازگردانی از فایل بکاپ"}</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFromFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {feedback.text}
        </div>
      )}

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h2 className="font-black text-sm">وضعیت زنده رکوردهای جداول آماده پشتیبان‌گیری</h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              fetchSnapshot();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
          >
            🔄 استعلام مجدد
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            در حال استخراج وضعیت جداول دیتابیس...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { key: "products", label: "📦 محصولات کاتالوگ" },
              { key: "categories", label: "📁 دسته‌بندی‌ها" },
              { key: "orders", label: "🧾 سفارشات و فاکتورها" },
              { key: "crm_customers", label: "👥 مشتریان CRM" },
              { key: "coupons", label: "🏷️ کدهای تخفیف" },
              { key: "banners", label: "🖼️ بنرها و اسلایدرها" },
              { key: "posts", label: "📚 مقالات مجله سئو" },
              { key: "tech_news", label: "📡 اخبار تکنولوژی" },
              { key: "modular_pages", label: "⚡ صفحات ماژولار" },
            ].map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1"
              >
                <span className="text-[var(--text-secondary)] font-bold block">{item.label}</span>
                <span className="font-mono font-black text-lg text-[var(--accent-blue)] block">
                  {counts[item.key] ?? 0} رکورد
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
