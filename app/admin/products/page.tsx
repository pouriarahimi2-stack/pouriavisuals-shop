// File Path: app/admin/products/page.tsx
import React from "react";
import BulkPriceStockStudio from "@/components/admin/BulkPriceStockStudio";
import AdminProducts from "@/components/AdminProducts";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <BulkPriceStockStudio />
      <AdminProducts />
    </div>
  );
}
