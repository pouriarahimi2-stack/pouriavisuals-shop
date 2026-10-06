// File Path: app/admin/pages/page.tsx
import React from "react";
import ProPageDesignStudio from "@/components/admin/ProPageDesignStudio";
import StorefrontLayoutStudio from "@/components/admin/StorefrontLayoutStudio";

export const dynamic = "force-dynamic";

export default function AdminRoutePage() {
  return (
    <div className="space-y-8">
      <ProPageDesignStudio />
      <StorefrontLayoutStudio defaultTab="page_builder" />
    </div>
  );
}
