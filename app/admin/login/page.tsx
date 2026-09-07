"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

function AdminLoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage("");

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanPass) {
      setErrorMessage("لطفاً کلمه عبور یا پین‌کد را وارد نمایید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass,
          pin: cleanPass,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setIsVerified(true);
        // هدایت مستقیم و قطعی به پیشخوان
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 600);
      } else {
        setErrorMessage(data.message || "نام کاربری یا کلمه عبور نادرست است.");
        setIsVerified(false);
      }
    } catch {
      setErrorMessage("خطا در برقراری ارتباط با سرور.");
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans select-none text-white relative overflow-hidden" dir="rtl">
      {/* هاله‌های نور پس‌زمینه */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-6">
        
        {isVerified ? (
          <div className="py-12 text-center space-y-4 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <h2 className="text-lg font-black text-emerald-400">احراز هویت با موفقیت تایید شد</h2>
            <p className="text-xs text-slate-400">در حال انتقال به پیشخوان مدیریت...</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-2xl text-blue-400 shadow-md">
                🛡️
              </div>
              <h1 className="text-lg font-black tracking-tight">ورود به پیشخوان مدیریت آکسون</h1>
              <p className="text-xs text-slate-400 font-medium">
                شناسه و کلمه عبور اختصاصی خود را وارد نمایید
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-shake">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">نام کاربری (Username):</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold outline-none focus:border-blue-500 transition text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">کلمه عبور یا پین‌کد (هر تعداد رقم):</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور خود را وارد کنید..."
                    className="w-full p-3.5 pl-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold outline-none focus:border-blue-500 transition text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
                    title="نمایش / پنهان‌سازی"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition shadow-xl shadow-blue-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loading ? "در حال اعتبارسنجی..." : "ورود به سیستم 🚀"}</span>
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-800/80 text-center">
              <Link href="/" className="text-[11px] text-slate-400 hover:text-white transition">
                ← بازگشت به صفحه اصلی سایت
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">در حال بارگذاری...</div>}>
      <AdminLoginComponent />
    </Suspense>
  );
}
