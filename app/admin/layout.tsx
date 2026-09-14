"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminNotificationProvider from "@/components/admin/AdminNotificationProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  return (
    <AdminNotificationProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none" dir="rtl">
        <AdminHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AdminNotificationProvider>
  );
}
