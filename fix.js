/**
 * AXON CORE - Dynamic Full-Length Password Login & Auth Engine (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) {
  console.log(`\x1b[36m[AXON-CORE]\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔ ${msg}\x1b[0m`);
}

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  success(`اصلاح شد: ${relPath}`);
}

log("شروع پیاده‌سازی صفحه لاگین جامع با پشتیبانی از هر تعداد رقم رمز عبور و دکمه چشم...");

// =============================================================================
// ۱. بازنویسی کامل صفحه ورود ادمین: app/admin/login/page.tsx
// =============================================================================
const loginPageContent = `"use client";

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
`;
writeFile('app/admin/login/page.tsx', loginPageContent);

// =============================================================================
// ۲. اصلاح دقیق API لاگین (app/api/admin/login/route.ts)
// =============================================================================
const loginApiSafe = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pinOrPassword = String(body.password || body.pin || "").trim();
    const username = String(body.username || "admin").trim().toLowerCase();

    if (!pinOrPassword) {
      return NextResponse.json({ success: false, message: "کلمه عبور الزامی است." }, { status: 400 });
    }

    // استعلام مشخصات ادمین از دیتابیس Supabase
    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq." + username + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "کاربری با این مشخصات یافت نشد." }, { status: 401 });
    }

    // تطبیق مستقیم با رمز ذخیره شده در دیتابیس
    const isMatched =
      adminUser.password === pinOrPassword ||
      adminUser.password_hash === pinOrPassword;

    if (!isMatched) {
      return NextResponse.json({ success: false, message: "کلمه عبور وارد شده نادرست است." }, { status: 401 });
    }

    const token = signPayload({
      id: String(adminUser.id),
      username: adminUser.username,
      role: adminUser.role || "superadmin",
      full_name: adminUser.full_name || adminUser.username,
    });

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      redirectUrl: "/admin",
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role || "superadmin",
      },
    });

    response.cookies.set("admin_session_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("pv_admin_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "خطای پردازش سرور." }, { status: 500 });
  }
}
`;
writeFile('app/api/admin/login/route.ts', loginApiSafe);

// =============================================================================
// ۳. تست بیلد و پوش مستقیم به گیت‌هاب
// =============================================================================
log("در حال اجرای تست بیلد محلی...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  success("بیلد با موفقیت پاس شد.");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(auth): unified username/password login with any password length, show/hide eye toggle and eliminate fake verified"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  success("تغییرات به گیت‌هاب ارسال و روی سرور لایو نشست!");
} catch (e) {
  console.error("خطای گیت:", e.message);
}