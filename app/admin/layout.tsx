"use client";
// File Path: app/admin/layout.tsx
import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminReadOnlyGuard from "@/components/admin/AdminReadOnlyGuard";
import { soundEngine } from "@/lib/soundEngine";
import { themeEngine } from "@/lib/themeEngine";

const SUPERADMIN_THEME_STORAGE_KEY = "axon_superadmin_panel_theme_v2026";

function applyAdminDomTheme(mode: "dark" | "light") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  }
  try {
    themeEngine.applyTheme(mode, false);
  } catch {}
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<{
    id?: string;
    username?: string;
    role?: string;
    ui_theme?: "dark" | "light";
  } | null>(null);
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">("dark");

  const syncAdminSessionAndTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.authenticated && json.user) {
        setAdminUser(json.user);
        const role = String(json.user.role || "superadmin");

        if (role === "superadmin") {
          // مدیر ارشد: خواندن آخرین تم انتخابی خودش از مرورگر یا دیتابیس
          const savedLocal =
            typeof window !== "undefined"
              ? (localStorage.getItem(SUPERADMIN_THEME_STORAGE_KEY) as "dark" | "light" | null)
              : null;
          const resolved: "dark" | "light" =
            savedLocal === "light" || savedLocal === "dark"
              ? savedLocal
              : json.user.ui_theme === "light"
              ? "light"
              : "dark";
          setActiveTheme(resolved);
          applyAdminDomTheme(resolved);
        } else {
          // سایر نقش‌ها: اعمال اجباری و دقیق تمی که مدیر ارشد برای این کاربر تعیین کرده است
          const assignedBySuperAdmin: "dark" | "light" =
            json.user.ui_theme === "light" ? "light" : "dark";
          setActiveTheme(assignedBySuperAdmin);
          applyAdminDomTheme(assignedBySuperAdmin);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) return;
    syncAdminSessionAndTheme();
  }, [pathname, syncAdminSessionAndTheme]);

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) {
    return <>{children}</>;
  }

  const isSuperAdmin = adminUser?.role === "superadmin";

  const handleToggleSuperAdminTheme = async () => {
    if (!isSuperAdmin) return;
    soundEngine.playClick();
    const nextTheme: "dark" | "light" = activeTheme === "dark" ? "light" : "dark";
    setActiveTheme(nextTheme);
    applyAdminDomTheme(nextTheme);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(SUPERADMIN_THEME_STORAGE_KEY, nextTheme);
      }
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_user_theme",
          id: adminUser?.id,
          username: adminUser?.username || "admin",
          ui_theme: nextTheme,
        }),
      });
    } catch {}
  };

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    router.replace("/admin/login");
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-text transition-colors duration-300"
      dir="rtl"
    >
      {/* نوار ارشد بالای پنل فرماندهی */}
      <header className="w-full px-4 sm:px-6 py-3 bg-[var(--modal-bg)] border-b border-[var(--card-border)] flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
        <div className="flex items-center gap-3">
          <span className="text-sm sm:text-base font-black text-[var(--accent-blue)]">
            آکسون کور | AXON CORE
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-xs font-bold text-[var(--text-secondary)]">
            مرکز فرماندهی و مدیریت یکپارچه سایت
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* دکمه تغییر تم دارک و لایت منحصراً برای مدیر ارشد (Super Admin) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleToggleSuperAdminTheme}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-black transition cursor-pointer flex items-center gap-1.5"
              title="تغییر تم پنل مدیریت (ویژه مدیر ارشد)"
            >
              <span>{activeTheme === "dark" ? "☀️" : "🌙"}</span>
              <span>{activeTheme === "dark" ? "تم روشن" : "تم تیره"}</span>
            </button>
          )}

          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            🏬 مشاهده زنده سایت
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer"
          >
            خروج امن
          </button>
        </div>
      </header>

      {/* بدنه اصلی پنل ادمین شامل سایدبار و محیط کاری محافظت‌شده */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar />
        <main
          id="axon-admin-main-workspace"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden"
        >
          <AdminReadOnlyGuard />
          {children}
        </main>
      </div>
    </div>
  );
}
