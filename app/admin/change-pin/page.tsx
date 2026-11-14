// File Path: app/admin/change-pin/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

const ROLE_LABELS_FA: Record<string, string> = {
  superadmin: "👑 مدیر ارشد کل سیستم",
  content_seo_manager: "🚀 کارشناس محتوا و سئو",
  order_manager: "💳 پشتیبان سفارشات و مالی",
  product_manager: "📦 مدیر کاتالوگ و انبار",
  viewer_reporter: "👁️ بیننده و گزارش‌دهنده",
};

export default function AdminChangePinPage() {
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    username?: string;
    role?: string;
    full_name?: string;
  } | null>(null);
  const [adminList, setAdminList] = useState<
    Array<{ id: string; username: string; full_name?: string; role: string }>
  >([]);
  const [targetUsername, setTargetUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth?t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.authenticated && json.user) {
          setCurrentUser(json.user);
          setTargetUsername(json.user.username || "");
          if (json.user.role === "superadmin") {
            fetch("/api/admin/users?t=" + Date.now(), { cache: "no-store" })
              .then((uRes) => uRes.json())
              .then((uJson) => {
                if (uJson.success && Array.isArray(uJson.users)) {
                  setAdminList(uJson.users);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const isResettingOtherAdmin =
    Boolean(currentUser?.username) &&
    Boolean(targetUsername) &&
    currentUser?.username?.toLowerCase() !== targetUsername.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setStatus(null);

    if (newPassword.trim().length < 4) {
      setStatus({
        type: "error",
        text: "رمز عبور یا پین جدید باید حداقل ۴ کاراکتر باشد.",
      });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setStatus({
        type: "error",
        text: "رمز عبور جدید با تکرار آن مطابقت ندارد.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: isResettingOtherAdmin ? "" : currentPassword.trim(),
          newPassword: newPassword.trim(),
          targetUsername: targetUsername || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatus({ type: "success", text: json.message });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus({
          type: "error",
          text: json.message || "خطا در تغییر رمز عبور.",
        });
      }
    } catch {
      setStatus({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-2">
        <h1 className="text-lg sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
          <span>🔐</span> تغییر رمز عبور و پین امنیتی مدیران (پشتیبانی از تمام نقش‌ها)
        </h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
          تمامی مدیران سامانه (مدیر ارشد، مدیر محصولات، مدیر سفارشات و ...) می‌توانند رمز عبور اختصاصی خود را به صورت رمزنگاری‌شده تغییر دهند.
        </p>
      </div>

      {status && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (status.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {status.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs"
      >
        {currentUser && (
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)] font-bold">
              حساب کاربری متصل:
            </span>
            <span className="font-mono font-black text-[var(--accent-blue)]">
              @{currentUser.username} ({ROLE_LABELS_FA[currentUser.role || ""] || currentUser.role})
            </span>
          </div>
        )}

        {currentUser?.role === "superadmin" && adminList.length > 0 && (
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              انتخاب مدیر هدف جهت تغییر یا بازنشانی رمز (ویژه مدیر ارشد):
            </label>
            <select
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer focus:border-[var(--accent-blue)]"
            >
              {adminList.map((u) => (
                <option key={u.id} value={u.username}>
                  👤 {u.full_name || u.username} (@{u.username}) — نقش:{" "}
                  {ROLE_LABELS_FA[u.role] || u.role}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isResettingOtherAdmin ? (
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              رمز عبور / پین فعلی:
            </label>
            <input
              type={showPass ? "text" : "password"}
              dir="ltr"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="رمز عبور فعلی خود را وارد کنید"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-[11px]">
            ⚡ حالت بازنشانی مستقیم مدیر ارشد فعال است: برای تغییر رمز زیرمجموعه «@{targetUsername}» نیازی به وارد کردن رمز قبلی او ندارید.
          </div>
        )}

        {/* گرید ۲ ستونه استاندارد و متقارن در دسکتاپ و ۱ ستونه در موبایل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              رمز عبور / پین جدید *
            </label>
            <input
              type={showPass ? "text" : "password"}
              required
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="حداقل ۴ کاراکتر"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
              تکرار رمز عبور جدید *
            </label>
            <input
              type={showPass ? "text" : "password"}
              required
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تکرار رمز جدید"
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-center outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 font-bold text-[var(--text-secondary)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPass}
            onChange={(e) => setShowPass(e.target.checked)}
            className="rounded accent-[var(--accent-blue)] cursor-pointer"
          />
          <span>👁️ نمایش کاراکترهای رمز عبور</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
        >
          {loading
            ? "در حال رمزنگاری و ذخیره..."
            : `💾 ثبت و تغییر رمز عبور برای @${targetUsername || "admin"} در دیتابیس`}
        </button>
      </form>
    </div>
  );
}