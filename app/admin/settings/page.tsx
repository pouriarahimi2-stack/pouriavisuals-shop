"use client";

import React from "react";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import Link from "next/link";

export default function AdminSettingsRoute() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-xs font-black text-[var(--accent-blue)]">🔐 امنیت حساب و دسترسی مدیریت</h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">تغییر کلمه عبور و پین‌کد ورود به سیستم</p>
        </div>
        <Link
          href="/admin/change-pin"
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md"
        >
          🔑 تغییر رمز عبور و پین مدیریت ←
        </Link>
      </div>
      <AdminSiteInfo />
    </div>
  );
}
