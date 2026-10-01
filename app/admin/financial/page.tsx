// File Path: app/admin/financial/page.tsx
"use client";
import React from "react";
import AdminInventoryManager from "@/components/AdminInventoryManager";

export default function AdminFinancialRoute() {
  return <AdminInventoryManager defaultSubTab="accounting" />;
}
