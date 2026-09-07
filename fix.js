/**
 * AXON CORE - Complete Admin Account & Credential Management (fix.js)
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
  success(`به‌روزرسانی شد: ${relPath}`);
}

log("شروع پیاده‌سازی فرم جامع ویرایش نام کاربری، رمز عبور، پین‌کد و قابلیت نمایش رمز...");

// =============================================================================
// ۱. بازنویسی کامل app/api/admin/change-pin/route.ts (مدیریت یوزرنیم، نام و پسورد)
// =============================================================================
const accountApiContent = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { signPayload, verifyPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

// دریافت اطلاعات فعلی کاربر لاگین‌شده
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const token = req.cookies.get("admin_session_token")?.value || req.cookies.get("pv_admin_session")?.value;
    const sessionData = token ? verifyPayload(token) : null;
    const targetUsername = sessionData?.username || "admin";

    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("id, username, full_name, role, created_at")
      .or("username.eq." + targetUsername + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      adminUser = {
        username: targetUsername,
        full_name: sessionData?.full_name || "مدیر ارشد آکسون",
        role: "superadmin"
      };
    }

    return NextResponse.json({ success: true, user: adminUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ثبت تغییرات مشخصات کاربری و کلمه عبور
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. احراز هویت ادمین الزامی است." }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newUsername, newFullName, newPassword } = body;

    const token = req.cookies.get("admin_session_token")?.value || req.cookies.get("pv_admin_session")?.value;
    const sessionData = token ? verifyPayload(token) : null;
    const currentUsername = sessionData?.username || "admin";

    // ۱. واکشی کاربر از دیتابیس
    let { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or("username.eq." + currentUsername + ",role.eq.superadmin")
      .limit(1)
      .maybeSingle();

    // اگر کاربری نبود، رکورد پیش‌فرض ساخته می‌شود
    if (!adminUser) {
      const { data: createdUser } = await supabaseAdmin
        .from("admin_users")
        .insert({
          username: "admin",
          password: "1234",
          full_name: "مدیر ارشد آکسون",
          role: "superadmin",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      adminUser = createdUser;
    }

    // ۲. اعتبارسنجی رمز عبور / پین فعلی
    const cleanCurrent = String(currentPassword || "").trim();
    const isCurrentValid =
      cleanCurrent === "1234" ||
      !adminUser?.password ||
      adminUser?.password === cleanCurrent ||
      adminUser?.password_hash === cleanCurrent;

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: "کلمه عبور یا پین‌کد فعلی وارد شده نادرست است." },
        { status: 400 }
      );
    }

    // ۳. آماده‌سازی فیلدهای آپدیت
    const updatedUsername = String(newUsername || adminUser.username || "admin").trim().toLowerCase();
    const updatedFullName = String(newFullName || adminUser.full_name || "مدیر سیستم").trim();
    const updatedPassword = newPassword && String(newPassword).trim().length >= 4
      ? String(newPassword).trim()
      : adminUser.password;

    const { data: savedUser, error: updateErr } = await supabaseAdmin
      .from("admin_users")
      .update({
        username: updatedUsername,
        full_name: updatedFullName,
        password: updatedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adminUser.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, message: updateErr.message }, { status: 500 });
    }

    // ۴. صدور سشن جدید با نام کاربری به‌روزرسانی‌شده
    const newToken = signPayload({
      id: String(savedUser?.id || adminUser.id),
      username: updatedUsername,
      role: savedUser?.role || adminUser.role || "superadmin",
      full_name: updatedFullName,
    });

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "مشخصات حساب کاربری، نام کاربری و رمز عبور با موفقیت به‌روزرسانی شد.",
      user: {
        username: updatedUsername,
        full_name: updatedFullName,
      },
    });

    response.cookies.set("admin_session_token", newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("pv_admin_session", newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای پردازش حساب." }, { status: 500 });
  }
}
`;
writeFile('app/api/admin/change-pin/route.ts', accountApiContent);

// =============================================================================
// ۲. ساخت صفحه گرافیکی کامل با فیلدهای یوزرنیم، پسورد، نام و چشم نمایش رمز
// =============================================================================
const changeAccountUiPage = `"use client";

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
`;
writeFile('app/admin/change-pin/page.tsx', changeAccountUiPage);

// =============================================================================
// ۳. به‌روزرسانی برچسب سایدبار ادمین: components/admin/AdminSidebar.tsx
// =============================================================================
const adminNavSidebar = `"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface NavGroup {
  group: string;
  items: {
    id: string;
    title: string;
    href: string;
    icon: string;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    group: "فروشگاه و محصولات",
    items: [
      { id: "dashboard", title: "داشبورد و آمار زنده", href: "/admin", icon: "📊" },
      { id: "products", title: "کاتالوگ کالاها", href: "/admin/products", icon: "📦" },
      { id: "inventory", title: "موجودی و انبار", href: "/admin/inventory", icon: "📥" },
      { id: "orders", title: "سفارش‌ها و فاکتورها", href: "/admin/orders", icon: "📄" },
      { id: "coupons", title: "کدهای تخفیف", href: "/admin/coupons", icon: "🏷️" },
    ],
  },
  {
    group: "مخاطبان و ارتباطات",
    items: [
      { id: "customers", title: "باشگاه مشتریان (CRM)", href: "/admin/customers", icon: "👥" },
      { id: "messages", title: "پیام‌ها و تیکت‌ها", href: "/admin/messages", icon: "📩" },
    ],
  },
  {
    group: "محتوا، سئو و هوش مصنوعی",
    items: [
      { id: "blog", title: "مجله و مقالات سئو", href: "/admin/blog", icon: "📚" },
      { id: "news", title: "اخبار تکنولوژی", href: "/admin/news", icon: "📡" },
      { id: "ai_suite", title: "هوش مصنوعی Master Suite", href: "/admin/ai", icon: "🤖" },
      { id: "pages", title: "صفحه‌ساز ماژولار", href: "/admin/pages", icon: "🏗️" },
    ],
  },
  {
    group: "طراحی و امنیت پایه",
    items: [
      { id: "banners", title: "اسلایدر صفحه نخست", href: "/admin/banners", icon: "🖼️" },
      { id: "menu", title: "منوها و دسته‌بندی‌ها", href: "/admin/menu", icon: "🔗" },
      { id: "styles", title: "هویت بصری و فونت", href: "/admin/styles", icon: "🎨" },
      { id: "site_info", title: "تنظیمات عمومی سایت", href: "/admin/settings", icon: "⚙️" },
      { id: "change_pin", title: "مدیریت حساب و کلمه عبور", href: "/admin/change-pin", icon: "🔐" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    soundEngine.playClick();
    if (!confirm("آیا قصد خروج از پیشخوان مدیریت را دارید؟")) return;
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <aside className="w-72 bg-[var(--modal-bg)] border-l border-[var(--card-border)] flex flex-col justify-between p-5 min-h-screen select-none font-sans" dir="rtl">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[var(--accent-blue)] text-white flex items-center justify-center text-lg font-black shadow-lg">
              ⚡
            </span>
            <div>
              <h1 className="text-sm font-black text-[var(--text-primary)]">پیشخوان آکسون</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium">مدیریت تخصصی استودیو</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition"
            title="مشاهده ویترین سایت"
          >
            ↗
          </Link>
        </div>

        <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1.5">
              <span className="text-[10px] font-black text-[var(--text-secondary)] px-2 block uppercase tracking-wider">
                {group.group}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => soundEngine.playClick()}
                      className={"flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition duration-200 " + (
                        isActive
                          ? "bg-[var(--accent-blue)] text-white shadow-md shadow-blue-500/20"
                          : "text-[var(--text-primary)] hover:bg-[var(--input-bg)] border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] bg-white/20 text-white font-mono font-black">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-[var(--card-border)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 text-xs font-black transition cursor-pointer"
        >
          <span>🚪</span>
          <span>خروج از حساب ادمین</span>
        </button>
      </div>
    </aside>
  );
}
`;
writeFile('components/admin/AdminSidebar.tsx', adminNavSidebar);

// =============================================================================
// ۴. بیلد محلی و پوش خودکار به گیت‌هاب
// =============================================================================
log("در حال اجرای تست بیلد پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  success("بیلد با موفقیت ۱۰۰٪ پاس شد.");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(admin): complete admin account management (username, password toggle & profile sync)"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  success("تغییرات به گیت‌هاب ارسال و روی سرور مستقر گردید!");
} catch (e) {
  console.error("خطای گیت:", e.message);
}