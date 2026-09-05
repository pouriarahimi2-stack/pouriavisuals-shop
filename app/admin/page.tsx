"use client";
import React from "react";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminOrders from "@/components/AdminOrders";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminDashboardStats />
      <AdminOrders />
    </div>
  );
}
