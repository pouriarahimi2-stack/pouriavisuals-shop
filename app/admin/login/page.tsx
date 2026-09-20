"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

export default function AdminLoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("superadmin");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        document.cookie = "admin_logged_in=true; path=/; max-age=" + (7 * 24 * 60 * 60);
        if (data.token) {
          document.cookie = "admin_session_token=" + data.token + "; path=/; max-age=" + (7 * 24 * 60 * 60);
        }
        window.location.href = "/admin/dashboard";
      } else {
        setErrorMessage(data.message || "نام کاربری یا رمز عبور نادرست است.");
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("تکرار کلمه عبور با رمز عبور مطابقت ندارد.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          username: username.trim(),
          password: password.trim(),
          full_name: fullName.trim(),
          role,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setSuccessMessage("✓ حساب مدیر ساخته شد. اکنون می‌توانید با اطلاعات خود وارد شوید.");
        setTab("login");
      } else {
        setErrorMessage(data.message || "خطا در ایجاد حساب کاربری.");
      }
    } catch {
      setErrorMessage("خطا در اتصال به سرور.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 font-sans select-none text-white overflow-hidden" dir="rtl">
      <div className="relative w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] bg-slate-900/95 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-6">
        
        {/* نوار انتخاب لاگین / ثبت‌نام اصولی */}
        <div className="flex p-1 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMessage(""); setSuccessMessage(""); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${tab === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            ورود به پیشخوان
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setErrorMessage(""); setSuccessMessage(""); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${tab === "register" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            ثبت‌نام مدیر جدید
          </button>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-base font-black">
            {tab === "login" ? "ورود به کنترل‌پنل مدیریت آکسون" : "ایجاد حساب مدیر / پرسنل جدید"}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {tab === "login" ? "شناسه و کلمه عبور ثبت‌شده خود را وارد نمایید" : "مشخصات حساب و نقش دسترسی پرسنل را وارد فرمایید"}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
            {successMessage}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 font-bold text-slate-300">نام کاربری (Username):</label>
              <input
                type="text"
                required
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری شما..."
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 font-mono font-bold text-xs outline-none focus:border-blue-500 text-white text-center"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-300">کلمه عبور:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 font-mono font-bold text-xs outline-none focus:border-blue-500 text-white text-center"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50"
            >
              {loading ? "در حال اعتبارسنجی در دیتابیس..." : "ورود به پیشخوان 🚀"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="block mb-1 font-bold text-slate-300">نام و نام خانوادگی:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: پوریا رحیمی"
                className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 font-bold text-xs outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-300">نام کاربری انگلیسی (Username):</label>
              <input
                type="text"
                required
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 font-mono font-bold text-xs outline-none text-center"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 font-bold text-slate-300">کلمه عبور:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور..."
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-slate-300">تکرار رمز:</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز..."
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-300">سطح دسترسی و نقش:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="superadmin">مدیر ارشد (دسترسی نامحدود)</option>
                <option value="content_editor">کارشناس محتوا و مقالات</option>
                <option value="support">پشتیبان سفارشات و مشتریان</option>
                <option value="viewer">فقط بیننده گزارشات</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-xl cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? "در حال ثبت حساب..." : "ثبت و ایجاد حساب مدیر ✓"}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800 text-center">
          <Link href="/" className="text-[11px] text-slate-400 hover:text-white transition">
            ← بازگشت به صفحه اصلی فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
}
