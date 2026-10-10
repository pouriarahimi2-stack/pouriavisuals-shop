import React from "react";
import CmsManagerStudio from "@/components/admin/CmsManagerStudio";
import StorefrontLayoutStudio from "@/components/admin/StorefrontLayoutStudio";

export const dynamic = "force-dynamic";

export default function AdminPagesRoute() {
  return (
    <div className="space-y-8">
      <CmsManagerStudio />
      <StorefrontLayoutStudio defaultTab="page_builder" />
    </div>
  );
}
