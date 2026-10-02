import React from "react";
import AdminInventoryManager from "@/components/AdminInventoryManager";

export const dynamic = "force-dynamic";

export default function AdminRoutePage() {
  return <AdminInventoryManager defaultSubTab="reports" />;
}
