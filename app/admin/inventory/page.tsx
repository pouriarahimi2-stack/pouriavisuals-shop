// File Path: app/admin/inventory/page.tsx
"use client";
import React from "react";
import AdminInventoryManager from "@/components/AdminInventoryManager";

export default function AdminInventoryRoute() {
  return <AdminInventoryManager defaultSubTab="accounting" />;
}
