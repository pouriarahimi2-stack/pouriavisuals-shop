"use client";
// File Path: app/admin/layout.tsx
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminReadOnlyGuard from "@/components/admin/AdminReadOnlyGuard";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/setup")) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    router.replace("/admin/login");
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-text"
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
