import React from "react";
import StorefrontLayoutStudio from "@/components/admin/StorefrontLayoutStudio";

export const dynamic = "force-dynamic";

export default function AdminRoutePage() {
  return <StorefrontLayoutStudio defaultTab="page_builder" />;
}
