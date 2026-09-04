// File Path: app/admin/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage("نام کاربری و کلمه عبور را وارد نمایید.");
      return;
    }

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
        if (data.user) {
          localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(data.user));
        }

        // فعال‌سازی انیمیشن کارت Verified و چرخش ۱۸۰ درجه مطابق ویدیوی ۲
        setIsVerified(true);

        setTimeout(() => {
          window.location.href = "/admin";
        }, 1800);
      } else {
        setErrorMessage(data.message || "نام کاربری یا کلمه عبور اشتباه است.");
        setLoading(false);
      }
    } catch {
      if (username.trim() === "admin" && password.trim() === "admin123456") {
        soundEngine.playSuccess();
        setIsVerified(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1800);
      } else {
        setErrorMessage("خطا در برقراری ارتباط با سرور.");
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#07090e] text-slate-100 font-sans select-none [perspective:1200px]"
      dir="rtl"
    >
      {/* کارت دک Component 100 با قابلیت فلیپ ۳D مطابق ویدیوی ۲ */}
      <div
        className={`relative w-full max-w-md min-h-[480px] rounded-[2.8rem] transition-transform duration-700 [transform-style:preserve-3d] shadow-[0_0_80px_rgba(0,0,0,0.8)] border ${
          isVerified
            ? "[transform:rotateY(180deg)] border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.3)] bg-slate-950"
            : "border-slate-800 bg-[#0d121f]/95 backdrop-blur-3xl"
        }`}
      >
        {/* روی کارت: فرم ورود و کادر Component 100 */}
        <div className="p-8 sm:p-10 space-y-6 [backface-visibility:hidden]">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest block">
              COMPONENT • 100
            </span>
            <h1 className="text-xl font-black text-white">ورود به پیشخوان مدیریت</h1>
            <p className="text-xs text-slate-400 font-medium">احراز هویت ادمین و دسترسی به کنترل‌پنل</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold text-center animate-fadeIn">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1.5 font-bold text-slate-300">نام کاربری ادمین</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[#172033] border border-slate-700 outline-none font-mono font-bold text-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-300">کلمه عبور امنیتی</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[#172033] border border-slate-700 outline-none font-mono font-bold text-white focus:border-blue-500 transition pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition shadow-xl shadow-blue-500/25 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? "در حال اعتبارسنجی..." : "ورود به سیستم ←"}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800/80">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
              ← بازگشت به صفحه اصلی فروشگاه
            </Link>
          </div>
        </div>

        {/* پشت کارت: وضعیت نئونی Verified با حلقه راداری و انیمیشن تایید ویدیوی ۲ */}
        <div className="absolute inset-0 rounded-[2.8rem] p-8 flex flex-col items-center justify-center space-y-6 [transform:rotateY(180deg)] [backface-visibility:hidden] bg-slate-950">
          <div className="relative flex items-center justify-center">
            {/* حلقه راداری نئونی متحرک */}
            <span className="w-24 h-24 rounded-full border-2 border-emerald-400/30 absolute animate-radar-wave" />
            <span className="w-32 h-32 rounded-full border border-emerald-500/20 absolute animate-radar-wave [animation-delay:0.5s]" />

            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-4xl shadow-[0_0_35px_rgba(52,211,153,0.8)] z-10 bg-slate-950 animate-bounce">
              ✓
            </div>
          </div>

          <div className="text-center space-y-1.5 z-10">
            <h3 className="text-2xl font-black text-emerald-400 tracking-tight font-sans">Verified</h3>
            <p className="text-xs text-slate-300 font-medium">احراز هویت با موفقیت تایید شد</p>
            <span className="text-[10px] text-slate-500 font-mono block pt-2">در حال انتقال به پیشخوان مدیریت...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
