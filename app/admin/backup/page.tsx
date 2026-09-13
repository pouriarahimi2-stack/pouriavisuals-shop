"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminBackupPage() {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    soundEngine.playClick();
    setLoadingExport(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error("خطا در دریافت فایل پشتیبان.");

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
      setStatusMsg({ type: "success", text: "فایل پشتیبان JSON با موفقیت دریافت و ذخیره شد." });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "خطا در خروجی گرفتن." });
    } finally {
      setLoadingExport(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClick();
    setLoadingImport(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsed = JSON.parse(rawContent);

        const res = await fetch("/api/admin/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          soundEngine.playSuccess();
          setStatusMsg({ type: "success", text: json.message || "اطلاعات با موفقیت بازگردانی شد." });
        } else {
          setStatusMsg({ type: "error", text: json.message || "خطا در بازگردانی داده‌ها." });
        }
      } catch {
        setStatusMsg({ type: "error", text: "فایل انتخاب‌شده یک فایل JSON معتبر نیست." });
      } finally {
        setLoadingImport(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
          <span>💾</span> پشتیبان‌گیری و بازیابی داده‌ها (Backup & Recovery)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
          خروجی کامل از محصولات، کوپن‌ها و تنظیمات ویترین به فرمت JSON و امکان بازگردانی سریع
        </p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition ${statusMsg.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30"}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <h3 className="text-sm font-black flex items-center gap-2">
            <span>📥</span> خروجی گرفتن از پایگاه داده (Export JSON)
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            یک نسخه کامل از موجودی انبار، کاتالوگ محصولات، کدهای تخفیف و بنرها را در یک فایل استاندارد ذخیره کنید.
          </p>
          <button
            onClick={handleExport}
            disabled={loadingExport}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            {loadingExport ? "در حال آماده‌سازی فایل..." : "دانلود نسخه پشتیبان (JSON) 📥"}
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <h3 className="text-sm font-black flex items-center gap-2">
            <span>📤</span> بازگردانی نسخه پشتیبان (Import JSON)
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            فایل JSON پشتیبان قبلی را انتخاب کنید تا اطلاعات محصولات و کدهای تخفیف مجدداً در دیتابیس بارگذاری و همگام شوند.
          </p>
          <label className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2">
            <span>{loadingImport ? "در حال بازگردانی..." : "انتخاب و بارگذاری فایل پشتیبان 📤"}</span>
            <input type="file" accept=".json" onChange={handleImport} disabled={loadingImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
