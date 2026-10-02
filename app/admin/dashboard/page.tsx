import React from "react";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";

export const dynamic = "force-dynamic";

export default function AdminRoutePage() {
  return <div className="space-y-6 font-sans select-text" dir="rtl"><AdminHealthGuard /><AdminDashboardStats /></div>;
}
