// File Path: app/admin/backup/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface BackupEntry {
  backupNumber: number;
  id: string;
  dateKey: string;
  createdAt: string;
  type: "auto_daily" | "manual";
  totalRecords: number;
  counts: Record<string, number>;
}

export default function AdminBackupPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [fullSnapshot, setFullSnapshot] = useState<any>(null);
  const [history, setHistory] = useState<BackupEntry[]>([]);
  const [latestBackupNumber, setLatestBackupNumber] = useState<number>(101);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSnapshotAndHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.backup) {
        setFullSnapshot(json.backup);
        setCounts(json.backup.counts || {});
        setHistory(Array.isArray(json.history) ? json.history : []);
        if (json.latestBackupNumber) setLatestBackupNumber(Number(json.latestBackupNumber));
      }
    } catch (e) {
      console.error("Backup load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshotAndHistory();
  }, []);

  const handleDownloadBackupJson = (customNumber?: number) => {
    if (!fullSnapshot) return;
    soundEngine.playSuccess();
    const num = customNumber || latestBackupNumber;
    const payloadToSave = {
      ...fullSnapshot,
      backupNumber: num,
      exported_at: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(payloadToSave, null, 2);
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "axoncore_backup_#" + num + "_" + dateTag + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      type: "success",
      text: "✓ فایل پشتیبان کامل شماره #" + num + " با فرمت JSON دانلود شد.",
    });
  };

  const handleCreateManualNumberedBackup = async () => {
    soundEngine.playClick();
    setCreatingBackup(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_numbered_backup", type: "manual" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFullSnapshot(json.backup);
        setHistory(json.history || []);
        setLatestBackupNumber(json.backupNumber);
        setFeedback({ type: "success", text: json.message });
      }
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "آیا از بازیابی اطلاعات سایت از طریق این فایل پشتیبان اطمینان دارید؟ تمامی اطلاعات فایل در جداول سایت بازنویسی و همگام می‌شوند."
      )
    ) {
      e.target.value = "";
      return;
    }

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
        fetchSnapshotAndHistory();
      } else {
        setFeedback({ type: "error", text: json.message || "خطا در بازیابی بکاپ." });
      }
    } catch {
      setFeedback({ type: "error", text: "فایل JSON انتخاب‌شده معتبر نیست." });
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
              <span>💾</span> مرکز پشتیبان‌گیری خودکار روزانه و بازیابی کامل سایت
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
              بکاپ خودکار روزانه در پس‌زمینه: فعال ✓ (آخرین شماره: #{latestBackupNumber})
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پشتیبان‌گیری اتوماتیک روزانه با شماره‌گذاری ترتیبی، دانلود مستقیم فایل JSON و بازیابی کامل در مواقع اضطراری
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto text-xs">
          <button
            type="button"
            onClick={handleCreateManualNumberedBackup}
            disabled={creatingBackup || loading}
            className="flex-1 lg:flex-initial justify-center px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black cursor-pointer transition"
          >
            {creatingBackup ? "در حال تولید..." : "➕ ثبت بکاپ شماره‌دار جدید"}
          </button>

          <button
            type="button"
            onClick={() => handleDownloadBackupJson()}
            disabled={loading || !fullSnapshot}
            className="flex-1 lg:flex-initial justify-center px-5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            ⬇️ دانلود فایل پشتیبان کامل (#{latestBackupNumber})
          </button>

          <label className="flex-1 lg:flex-initial justify-center px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg transition cursor-pointer flex items-center gap-2">
            <span>{restoring ? "در حال بازیابی..." : "⬆️ بازیابی سایت از فایل پشتیبان"}</span>
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

      {/* آرشیو بکاپ‌های خودکار روزانه شماره‌گذاری‌شده */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h2 className="font-black text-sm text-[var(--accent-blue)]">
            🗂️ آرشیو پشتیبان‌های خودکار روزانه شماره‌گذاری‌شده ({history.length})
          </h2>
          <button
            type="button"
            onClick={fetchSnapshotAndHistory}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
          >
            🔄 بروزرسانی لیست
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 font-bold">
            در حال بررسی آرشیو پشتیبان‌های روزانه...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-bold">
            اولین بکاپ خودکار روزانه آماده دانلود است.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[var(--accent-blue)] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-mono font-black text-sm">
                    #{item.backupNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">
                        فایل پشتیبان شماره #{item.backupNumber}
                      </span>
                      <span
                        className={
                          "px-2 py-0.5 rounded-md text-[10px] font-bold " +
                          (item.type === "auto_daily"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-indigo-500/15 text-indigo-400")
                        }
                      >
                        {item.type === "auto_daily" ? "بکاپ اتوماتیک روزانه 🕒" : "ثبت دستی ادمین"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      تاریخ: {new Date(item.createdAt).toLocaleString("fa-IR")} | مجموع رکوردها:{" "}
                      {item.totalRecords} رکورد
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadBackupJson(item.backupNumber)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-emerald-500 text-emerald-400 font-black cursor-pointer transition"
                >
                  ⬇️ دانلود فایل JSON شماره #{item.backupNumber}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* وضعیت زنده جداول */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h2 className="font-black text-sm border-b border-[var(--card-border)] pb-3">
          📊 وضعیت زنده رکوردهای دیتابیس در فایل پشتیبان
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: "products", label: "📦 محصولات" },
            { key: "categories", label: "📁 دسته‌بندی‌ها" },
            { key: "orders", label: "🧾 سفارشات" },
            { key: "crm_customers", label: "👥 مشتریان CRM" },
            { key: "coupons", label: "🏷️ کدهای تخفیف" },
            { key: "banners", label: "🖼️ بنرها" },
            { key: "posts", label: "📚 مقالات سئو" },
            { key: "tech_news", label: "📡 اخبار تکنولوژی" },
            { key: "modular_pages", label: "⚡ صفحات ماژولار" },
            { key: "site_info", label: "⚙️ تنظیمات سایت" },
            { key: "site_styles", label: "🎨 استایل‌ها" },
            { key: "inventory_logs", label: "🏭 اسناد انبار" },
          ].map((item) => (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1"
            >
              <span className="text-[var(--text-secondary)] font-bold block truncate">
                {item.label}
              </span>
              <span className="font-mono font-black text-base text-[var(--accent-blue)] block">
                {counts[item.key] ?? 0} رکورد
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
