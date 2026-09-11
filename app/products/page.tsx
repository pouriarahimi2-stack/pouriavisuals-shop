import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import ProductArchiveClient from "@/components/ProductArchiveClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کاتالوگ و خرید مانیتورهای ۵K و تجهیزات استودیویی | آکسون",
  description: "مرجع تخصصی مانیتورهای تدوین رنگ ۵K و ۴K، استودیو دیسپلی، پردازنده‌های گرافیکی و کابل‌های تاندربولت با گارانتی اصالت طلایی در آکسون کور.",
  openGraph: {
    title: "کاتالوگ تخصصی تجهیزات استودیو و تصویر | آکسون",
    description: "تامین رسمی مانیتورهای کالیبره استودیویی و تجهیزات حرفه‌ای تدوین در ایران.",
    url: "https://axoncore.ir/products",
    type: "website",
  },
  alternates: {
    canonical: "https://axoncore.ir/products",
  },
};

export default async function ProductsArchivePage() {
  let products: any[] = [];
  let categories: string[] = [];

  try {
    if (supabaseAdmin) {
      const [prodsRes, catsRes] = await Promise.all([
        supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("categories").select("name"),
      ]);

      if (prodsRes.data && prodsRes.data.length > 0) {
        products = prodsRes.data;
      } else {
        products = FLAGSHIP_7_PRODUCTS;
      }

      if (catsRes.data) {
        categories = catsRes.data.map((c: any) => c.name);
      }
    }
  } catch (err) {
    products = FLAGSHIP_7_PRODUCTS;
  }

  if (categories.length === 0) {
    categories = Array.from(new Set(products.map((p) => p.category || "تجهیزات تخصصی"))).filter(Boolean);
  }

  // اسکیمای رسمی ItemList گوگل برای قرارگیری در ریچ‌اسنیپت محصولات
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "کاتالوگ تجهیزات تصویر و مانیتورهای ۵K آکسون",
    "itemListElement": products.slice(0, 15).map((prod, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://axoncore.ir/products/${prod.id}`,
      "name": prod.title || prod.name,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans select-none text-[var(--text-primary)] space-y-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-[11px] font-bold">
          STUDIO GEAR CATALOG • 2026
        </span>
        <h1 className="text-2xl md:text-4xl font-black">تجهیزات تخصصی تدوین، تصویر و مانیتورهای استودیو</h1>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
          کلیه کالاها با تست سلامت پنل، گارانتی اصالت طلایی و ارسال پیشتاز استودیویی عرضه می‌شوند.
        </p>
      </div>

      <ProductArchiveClient initialProducts={products} categories={categories} />
    </div>
  );
}
