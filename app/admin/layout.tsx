import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex font-sans" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-4 sm:p-6 border-b border-[var(--card-border)] bg-[var(--modal-bg)]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex-1">
            <AdminGlobalSearch />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <AdminHealthGuard />
          {children}
        </main>
      </div>
    </div>
  );
}
