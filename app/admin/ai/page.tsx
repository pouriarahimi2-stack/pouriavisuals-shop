"use client";

import React, { Suspense } from "react";
import AdminAiMasterSuite from "@/components/admin/AdminAiMasterSuite";

export const dynamic = "force-dynamic";

export default function AdminAiRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[var(--text-secondary)]">در حال آماده‌سازی ابزارهای هوش مصنوعی...</div>}>
      <AdminAiMasterSuite />
    </Suspense>
  );
}
