"use client";

import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { NotificationProvider } from "@/components/admin/AdminNotificationProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans select-none" dir="rtl">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
