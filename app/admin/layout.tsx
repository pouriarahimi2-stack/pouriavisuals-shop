"use client";
import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans"
      dir="rtl"
      style={{ overflowX: "hidden" }}
    >
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* هدر ادمین */}
        <div className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--modal-bg)]/95 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <span className="font-black text-xs text-[var(--accent-blue)]">آکسون کور</span>
          <span className="text-[var(--text-secondary)] text-xs">|</span>
          <span className="text-xs text-[var(--text-secondary)] font-bold">پنل مدیریت</span>
          <div className="mr-auto">
            <a href="/" target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-blue)] transition">
              🏪 مشاهده سایت
            </a>
          </div>
        </div>

        {/* محتوا */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
