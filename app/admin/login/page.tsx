"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // رمز عبور پیش‌فرض
  const ADMIN_PASSWORD = "admin";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("لطفاً آدرس ایمیل را وارد کنید.");
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError("رمز عبور وارد شده اشتباه است!");
      return;
    }

    // ثبت ورود مدیر در سیستم
    localStorage.setItem("isAdminLoggedIn", "true");
    localStorage.setItem("adminEmail", cleanEmail);
    document.cookie = "admin_session=true; path=/";

    router.replace("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07090e] font-sans text-white relative overflow-hidden select-none">
      {/* هاله نور پس‌زمینه */}
      <div className="fixed top-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-600/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-6 shadow-2xl backdrop-blur-2xl relative z-10">
        <div className="text-center space-y-3">
          <span className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 inline-block text-2xl">
            🔐
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">ورود به پنل مدیریت</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            جهت دسترسی به داشبورد، ایمیل و رمز عبور خود را وارد کنید.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold text-center leading-relaxed animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold mb-2 text-slate-300">
              ایمیل مدیر:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@site.com"
              required
              suppressHydrationWarning
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none text-sm font-mono font-bold focus:border-indigo-500 transition text-white placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold mb-2 text-slate-300">
              رمز عبور:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              suppressHydrationWarning
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none text-sm font-mono font-bold focus:border-indigo-500 transition text-white placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all duration-300 shadow-lg shadow-indigo-600/30 cursor-pointer flex justify-center items-center gap-2"
          >
            <span>ورود به پنل مدیریت 🚀</span>
          </button>
        </form>
      </div>
    </div>
  );
}