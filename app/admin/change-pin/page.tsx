"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminChangePinPage() {
  const [currentUsername, setCurrentUsername] = useState("admin");
  const [fullName, setFullName] = useState("");
  const [newUsername, setNewUsername] = useState("admin");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newStaffUser, setNewStaffUser] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("content_editor");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAdminInfo = async () => {
    try {
      const res = await fetch("/api/admin/change-pin");
      const json = await res.json();
      if (json.success && json.user) {
        setCurrentUsername(json.user.username || "admin");
        setNewUsername(json.user.username || "admin");
        setFullName(json.user.full_name || "مدیر ارشد آکسون");
      }
    } catch {}
  };

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "تکرار کلمه عبور با مقدار جدید مطابقت ندارد." });
      return;
    }

    soundEngine.playClick();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newUsername: newUsername.trim(),
          newFullName: fullName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatus({ type: "success", text: "✓ کلمه عبور با موفقیت تغییر کرد و در دیتابیس ثبت شد." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        loadAdminInfo();
      } else {
        setStatus({ type: "error", text: data.message || "خطا در تغییر کلمه عبور." });
      }
    } catch {
      setStatus({ type: "error", text: "خطا در اتصال به سرور." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setStatus(null);

    try {
      const res = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_staff",
          username: newStaffUser,
          password: newStaffPass,
          full_name: newStaffName,
          role: newStaffRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setStatus({ type: "success", text: data.message });
        setNewStaffUser("");
        setNewStaffPass("");
        setNewStaffName("");
        loadAdminInfo();
      } else {
        setStatus({ type: "error", text: data.message || "خطا در ایجاد کاربر." });
      }
    } catch {
      setStatus({ type: "error", text: "خطا در برقراری ارتباط." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-2xl shadow">🔐</span>
            <div>
              <h1 className="text-base font-black">مدیریت حساب مدیران و سطوح دسترسی پرسنل</h1>
              <p className="text-xs text-[var(--text-secondary)] font-medium">تعریف مدیر جدید با نقش اختصاصی یا تغییر کلمه عبور</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[var(--input-bg)] border font-mono text-xs font-bold text-[var(--accent-blue)]">
            کاربر جاری: {currentUsername}
          </span>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl text-xs font-bold ${status.type === "success" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"}`}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <h3 className="font-black text-xs text-[var(--accent-blue)]">🔑 ویرایش مشخصات و رمز عبور حساب شما:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[var(--text-secondary)] mb-1 block">نام و نام خانوادگی:</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs" />
            </div>
            <div>
              <label className="font-bold text-[var(--text-secondary)] mb-1 block">نام کاربری (Username):</label>
              <input type="text" dir="ltr" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold text-xs" />
            </div>
            <div>
              <label className="font-bold text-[var(--text-secondary)] mb-1 block">کلمه عبور فعلی:</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="رمز فعلی..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            </div>
            <div>
              <label className="font-bold text-[var(--text-secondary)] mb-1 block">کلمه عبور جدید:</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="رمز جدید..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-[var(--text-secondary)] mb-1 block">تکرار کلمه عبور جدید:</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تکرار رمز جدید..." className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 shadow">
            {loading ? "در حال ثبت..." : "ذخیره تغییرات رمز عبور 🔒"}
          </button>
        </form>

        <div className="border-t border-[var(--card-border)] pt-6 space-y-4 text-xs">
          <h3 className="font-black text-xs text-emerald-500">➕ ثبت مدیر یا پرسنل جدید با سطح دسترسی مشخص:</h3>
          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" required placeholder="نام و نام خانوادگی" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold" />
            <input type="text" required dir="ltr" placeholder="نام کاربری (انگلیسی)" value={newStaffUser} onChange={(e) => setNewStaffUser(e.target.value)} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            <input type="password" required placeholder="کلمه عبور" value={newStaffPass} onChange={(e) => setNewStaffPass(e.target.value)} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold">
              <option value="superadmin">مدیر ارشد (Super Admin)</option>
              <option value="content_editor">کارشناس محتوا و سئو (Editor)</option>
              <option value="support">پشتیبانی سفارشات (Support)</option>
              <option value="viewer">بیننده گزارش‌ها (Viewer)</option>
            </select>
            <div className="sm:col-span-4">
              <button type="submit" className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow">
                + ایجاد حساب کارمند / مدیر
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
