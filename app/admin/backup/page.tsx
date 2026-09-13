"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminBackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDownloadBackup = async () => {
    soundEngine.playClick();
    setDownloading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "خطا در دریافت خروجی پشتیبان از سرور.");
      }

      // دریافت محتوای فایل جیسون
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `axon-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      soundEngine.playSuccess();
      setStatusMsg({
        type: "success",
        text: "فایل پشتیبان کامل با موفقیت دانلود شد و رویداد آن در لاگ‌های امنیتی ثبت گردید.",
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "خطا در برقراری ارتباط با سرور." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-4xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
          <span>💾</span> مرکز پشتیبان‌گیری و حفاظت داده‌ها (Disaster Recovery)
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
          تهیه نسخه پشتیبان ساختاریافته از تمامی جداول محصولات، سفارشات، کدهای تخفیف، بنرها و لاگ‌های امنیتی
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
            <span className="text-2xl block">📊</span>
            <span className="text-xs font-bold text-[var(--text-primary)] block">پوشش ۷ جدول اصلی</span>
            <span className="text-[10px] text-slate-400 block">شامل محصولات، سفارشات و تنظیمات</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
            <span className="text-2xl block">🛡️</span>
            <span className="text-xs font-bold text-[var(--text-primary)] block">حفاظت سشن RBAC</span>
            <span className="text-[10px] text-slate-400 block">دسترسی انحصاری سوپرادمین</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
            <span className="text-2xl block">📝</span>
            <span className="text-xs font-bold text-[var(--text-primary)] block">ثبت خودکار Audit Trail</span>
            <span className="text-[10px] text-slate-400 block">ثبت IP و متادیتای دریافت خروجی</span>
          </div>
        </div>

        <div className="border-t border-[var(--card-border)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            فرمت خروجی استاندارد JSON (سازگار با ایمپورت و بازیابی پایگاه داده Supabase)
          </span>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>📥</span>
            {downloading ? "در حال تجمیع و ساخت اسنپ‌شات..." : "دریافت فایل کامل پشتیبان (.json)"}
          </button>
        </div>
      </div>
    </div>
  );
}
