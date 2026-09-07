"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

export default function ChangePinPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setStatus(null);

    if (newPassword.length < 4) {
      setStatus({ type: "error", text: "رمز عبور جدید باید حداقل ۴ رقم یا کاراکتر باشد." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "تکرار رمز عبور جدید با رمز عبور وارد شده تطابق ندارد." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatus({ type: "success", text: "✓ رمز عبور با موفقیت در دیتابیس ثبت شد. از این پس با مشخصات جدید وارد شوید." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus({ type: "error", text: data.message || "خطا در تغییر رمز عبور." });
      }
    } catch {
      setStatus({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center text-2xl shadow-lg">
            🔑
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black">مدیریت و تغییر رمز عبور / پین‌کد مدیریت</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
              تنظیم رمز عبور اختصاصی جهت ورود به پیشخوان ادمین
            </p>
          </div>
        </div>

        {status && (
          <div
            className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (
              status.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
            )}
          >
            {status.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">رمز عبور / پین‌کد فعلی:</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-black text-center outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)] tracking-widest"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">رمز عبور / پین‌کد جدید (حداقل ۴ کاراکتر):</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-black text-center outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)] tracking-widest"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تکرار رمز عبور / پین‌کد جدید:</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-black text-center outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)] tracking-widest"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? "در حال ذخیره‌سازی در دیتابیس..." : "ذخیره تغییرات در دیتابیس 🔒"}</span>
            </button>
          </div>
        </form>

        <div className="pt-3 border-t border-[var(--card-border)] flex justify-between items-center text-xs">
          <Link
            href="/admin"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition"
          >
            ← بازگشت به پیشخوان
          </Link>
        </div>
      </div>
    </div>
  );
}
