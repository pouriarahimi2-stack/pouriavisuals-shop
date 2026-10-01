// File Path: app/admin/orders/page.tsx
"use client";
import React from "react";
import AdminInventoryManager from "@/components/AdminInventoryManager";

export default function AdminOrdersRoute() {
  return <AdminInventoryManager defaultSubTab="orders" />;
}
