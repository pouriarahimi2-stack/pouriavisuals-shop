import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import DynamicHomeSections from "@/components/DynamicHomeSections";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آکسون کور | فروشگاه مدرن محصولات تکنولوژی و گجت‌های هوشمند",
  description: "عرضه تخصصی جدیدترین محصولات تکنولوژی، گجت‌های دیجیتال و ابزارهای هوشمند با گارانتی اصالت طلایی و ارسال سریع به سراسر کشور.",
  alternates: {
    canonical: "https://axoncore.ir",
  },
  openGraph: {
    title: "آکسون کور | مرجع خرید محصولات فناوری و گجت‌ها",
    description: "مرجع تامین و خرید آنلاین جدیدترین کالاهای تکنولوژی و گجت‌های هوشمند اورجینال.",
    url: "https://axoncore.ir",
    type: "website",
  },
};

export default async function HomePage() {
  let products: any[] = [];
  let banners: any[] = [];
  let siteSettings: any = null;

  try {
    if (supabaseAdmin) {
      const [prodRes, bannerRes, siteInfoRes] = await Promise.all([
        supabaseAdmin.from("products").select("*").eq("is_available", true).order("created_at", { ascending: false }).limit(24),
        supabaseAdmin.from("banners").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(6),
        supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle(),
      ]);

      if (prodRes.data && prodRes.data.length > 0) {
        products = prodRes.data;
      }
      if (bannerRes.data) {
        banners = bannerRes.data;
      }
      if (siteInfoRes.data) {
        siteSettings = siteInfoRes.data;
      }
    }
  } catch (err) {
    console.warn("Home page data fetch warning:", err);
  }

  const baseUrl = "https://axoncore.ir";
  const storeName = siteSettings?.storeName || siteSettings?.site_name || "آکسون کور | Axon Core";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": storeName,
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.ico`,
    "description": siteSettings?.description || "فروشگاه آنلاین جدیدترین کالاهای فناوری و گجت‌های هوشمند در ایران",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": siteSettings?.phone || "+98-9376110200",
      "contactType": "customer service",
      "areaServed": "IR",
      "availableLanguage": ["Persian", "English"],
    },
    "sameAs": [
      "https://instagram.com/axoncore.ir",
      "https://youtube.com/@axoncore",
    ],
  };

  return (
    <div className="font-sans select-none text-[var(--text-primary)] space-y-12 pb-32 sm:pb-8" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <DynamicHomeSections initialProducts={products} initialBanners={banners} initialSiteInfo={siteSettings} />
    </div>
  );
}
