"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthService } from "@/services/adminAuthService";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await adminAuthService.login(username, password);
      if (res.success) {
        router.replace("/admin");
      } else {
        setErrorMsg(res.message || "اطلاعات ورود نامعتبر است.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 font-sans select-none text-[var(--text-primary)] transition-colors duration-300" dir="rtl">
      
      {/* باکس لاگین */}
      <div className="w-full max-w-md rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] p-8 md:p-10 shadow-2xl space-y-6 backdrop-blur-2xl animate-fadeIn">
        
        {/* هدر باکس */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] flex items-center justify-center text-2xl mx-auto shadow-md">
            ⚡
          </div>
          <h1 className="text-xl md:text-2xl font-black">ورود به پنل مدیریت فروشگاه</h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">احراز هویت ادمین و دسترسی به امکانات مدیریتی</p>
        </div>

        {/* پیام خطا */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center gap-2 animate-fadeIn">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* فرم ورود */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام کاربری ادمین</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin..."
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] transition"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلمه عبور امنیتی</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono focus:border-[var(--accent-blue)] transition pl-11 text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer p-1"
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? "در حال اعتبارسنجی..." : "ورود به پیشخوان مدیریت ←"}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--card-border)] text-center">
          <Link
            href="/"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-blue)] font-bold transition"
          >
            ← بازگشت به صفحه اصلی فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
}