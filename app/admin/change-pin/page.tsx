"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

export default function AdminChangePinPage() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadAdminInfo() {
      try {
        const res = await fetch("/api/admin/change-pin");
        const json = await res.json();
        if (json.success && json.user) {
          setCurrentUsername(json.user.username || "admin");
          setNewUsername(json.user.username || "admin");
          setFullName(json.user.full_name || "مدیر ارشد آکسون");
        }
      } catch (err) {
        console.warn("Error loading account profile:", err);
      } finally {
        setFetching(false);
      }
    }
    loadAdminInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setStatus(null);

    if (newPassword && newPassword.length < 4) {
      setStatus({ type: "error", text: "کلمه عبور / پین جدید باید حداقل ۴ رقم یا کاراکتر باشد." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "تکرار کلمه عبور جدید با مقدار وارد شده تطابق ندارد." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername.trim(),
          newFullName: fullName.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatus({
          type: "success",
          text: "✓ اطلاعات با موفقیت ثبت شد. نام کاربری و کلمه عبور شما در دیتابیس به‌روزرسانی گردید.",
        });
        setCurrentUsername(newUsername.trim());
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus({ type: "error", text: data.message || "خطا در به‌روزرسانی مشخصات حساب." });
      }
    } catch {
      setStatus({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 sm:p-10 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center text-2xl shadow-lg">
              🔐
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black">مدیریت حساب و امنیت پیشخوان</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                ویرایش نام کاربری (Username)، نام نمایشی، کلمه عبور و پین ورود
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs font-bold text-[var(--accent-blue)]">
            کاربر: {currentUsername}
          </span>
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

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* مشخصات هویتی ادمین */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">نام و نام خانوادگی مدیر:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثلاً: پوریا رحیمی"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">نام کاربری اختصاصی (Username):</label>
              <input
                type="text"
                required
                dir="ltr"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                placeholder="admin"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="border-t border-[var(--card-border)] pt-4 space-y-4">
            <h3 className="font-black text-xs text-[var(--accent-blue)]">🔑 تغییر کلمه عبور یا پین‌کد ورود</h3>

            {/* رمز فعلی با دکمه چشم */}
            <div className="space-y-1.5">
              <label className="font-bold text-[var(--text-secondary)]">کلمه عبور یا پین‌کد فعلی (پیش‌فرض: 1234):</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="رمز عبور فعلی..."
                  className="w-full p-3.5 pl-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-60 hover:opacity-100 transition cursor-pointer"
                  title="نمایش / مخفی‌سازی"
                >
                  {showCurrent ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* رمز جدید */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-secondary)]">کلمه عبور / پین جدید (حداقل ۴ نویسه):</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="کلمه عبور جدید..."
                    className="w-full p-3.5 pl-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-60 hover:opacity-100 transition cursor-pointer"
                    title="نمایش / مخفی‌سازی"
                  >
                    {showNew ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* تکرار رمز جدید */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-secondary)]">تکرار کلمه عبور / پین جدید:</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار کلمه عبور جدید..."
                    className="w-full p-3.5 pl-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold outline-none focus:border-[var(--accent-blue)] transition text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-60 hover:opacity-100 transition cursor-pointer"
                    title="نمایش / مخفی‌سازی"
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">
              نکته: در صورتی که فیلد کلمه عبور جدید را خالی بگذارید، رمز عبور تغییر نکرده و صرفاً نام کاربری و نام نمایشی شما به‌روزرسانی خواهد شد.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || fetching}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? "در حال ذخیره‌سازی در دیتابیس..." : "ذخیره تغییرات حساب و کلمه عبور 🔒"}</span>
            </button>
          </div>
        </form>

        <div className="pt-3 border-t border-[var(--card-border)] flex justify-between items-center text-xs">
          <Link
            href="/admin"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition"
          >
            ← بازگشت به پیشخوان ادمین
          </Link>
        </div>
      </div>
    </div>
  );
}
