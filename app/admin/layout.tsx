import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans"
      dir="rtl"
      style={{ overflowX: "hidden" }}
    >
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        <div className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--modal-bg)]/95 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <span className="font-black text-xs text-[var(--accent-blue)]">آکسون کور | AXON CORE</span>
          <span className="text-[var(--text-secondary)] text-xs">|</span>
          <span className="text-xs text-[var(--text-secondary)] font-bold">مرکز فرماندهی و مدیریت یکپارچه سایت</span>
          <div className="mr-auto flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition"
            >
              🏪 مشاهده زنده سایت
            </a>
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
