"use client";
import { useState } from "react";
export default function VariantStudio({ productId }: { productId: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 mt-6">
      <h3 className="text-xs md:text-lg font-bold line-clamp-2">مدیریت تنوع کالا (Variants)</h3>
      <p className="text-sm text-gray-500 mb-4">به زودی: رابط کاربری اتصال رنگ، سایز و قیمت‌های متغیر به این محصول در این بخش فعال خواهد شد.</p>
    </div>
  );
}
