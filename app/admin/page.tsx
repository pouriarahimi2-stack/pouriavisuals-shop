// File Path: app/admin/page.tsx
"use client";

import React from "react";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 font-sans select-none" dir="rtl">
      <AdminHealthGuard />
      <AdminDashboardStats />
    </div>
  );
}
