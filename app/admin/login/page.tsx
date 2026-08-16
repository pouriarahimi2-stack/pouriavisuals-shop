"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminAuthService } from "@/services/adminAuthService";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await adminAuthService.login(username, password);

      if (res.success && res.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_logged_in", "true");
          localStorage.setItem("isAdminLoggedIn", "true");
          localStorage.setItem("admin_current_user", JSON.stringify(res.user));
          document.cookie = `admin_session=authenticated; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `admin_role=${res.user.role}; path=/; max-age=604800; SameSite=Lax`;
        }
        router.push("/admin");
      } else {
        setErrorMsg(res.message || "نام کاربری یا رمز عبور اشتباه است.");
      }
    } catch {
      setErrorMsg("خطا در برقراری ارتباط با سرور احراز هویت.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white relative overflow-hidden font-sans select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">ورود به پنل مدیریت</h1>
          <p className="text-xs text-zinc-400">سامانه احراز هویت هوشمند با تفکیک سطوح دسترسی</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-bold animate-fadeIn">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {mounted ? (
          <form onSubmit={handleLogin} suppressHydrationWarning className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">نام کاربری</label>
              <input
                type="text"
                required
                suppressHydrationWarning
                placeholder="نام کاربری..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">رمز عبور</label>
              <input
                type="password"
                required
                suppressHydrationWarning
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <span>احراز هویت و ورود به پنل</span>
              )}
            </button>
          </form>
        ) : (
          <div className="py-12 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" />
          </div>
        )}

        <div className="pt-2 text-center border-t border-zinc-800/80">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-[11px] transition font-medium">
            ← بازگشت به صفحه اصلی سایت
          </Link>
        </div>
      </div>
    </div>
  );
}