import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";
import DynamicHomeSections from "@/components/DynamicHomeSections";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آکسون کور | مرجع مانیتورهای ۵K، تجهیزات تدوین و استودیو رنگ",
  description: "عرضه تخصصی مانیتورهای استودیو دیسپلی، ۵K رتینا، پردازنده‌های گرافیکی و کابل‌های تاندربولت با گارانتی اصالت طلایی و تست سلامت پنل در آکسون.",
  alternates: {
    canonical: "https://axoncore.ir",
  },
  openGraph: {
    title: "آکسون کور | تجهیزات تخصصی استودیو و تدوین",
    description: "تامین رسمی مانیتورهای کالیبره ۵K و تجهیزات حرفه‌ای تصویر در ایران.",
    url: "https://axoncore.ir",
    type: "website",
  },
};

export default async function HomePage() {
  let products = FLAGSHIP_7_PRODUCTS;
  let banners: any[] = [];

  try {
    if (supabaseAdmin) {
      const [prodRes, bannerRes] = await Promise.all([
        supabaseAdmin.from("products").select("*").eq("is_available", true).order("created_at", { ascending: false }).limit(16),
        supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false }).limit(6),
      ]);

      if (prodRes.data && prodRes.data.length > 0) {
        products = prodRes.data;
      }
      if (bannerRes.data) {
        banners = bannerRes.data;
      }
    }
  } catch {}

  const baseUrl = "https://axoncore.ir";

  // ۱. اسکیمای ساختاریافته Organization
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "آکسون کور | Axon Core",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.ico`,
    "description": "مرجع تخصصی مانیتورهای تدوین رنگ ۵K و تجهیزات استودیویی در ایران",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+98-21-00000000",
      "contactType": "customer service",
      "areaServed": "IR",
      "availableLanguage": ["Persian", "English"],
    },
    "sameAs": [
      "https://instagram.com/axoncore.ir",
      "https://youtube.com/@axoncore",
    ],
  };

  // ۲. اسکیمای WebSite با قابلیت Sitelinks Searchbox برای گوگل
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "آکسون کور",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="font-sans select-none text-[var(--text-primary)] space-y-12" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <DynamicHomeSections initialProducts={products} initialBanners={banners} />
    </div>
  );
}
