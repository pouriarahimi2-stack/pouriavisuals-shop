// File Path: app/page.tsx
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import DynamicHomeSections from "@/components/DynamicHomeSections";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آکسون کور | فروشگاه مدرن محصولات تکنولوژی و گجت‌های هوشمند",
  description: "عرضه تخصصی محصولات با گارانتی اصالت.",
  alternates: { canonical: "https://axoncore.ir" },
};

function safeJsonLd(obj: Record<string, any>): string {
  return JSON.stringify(obj).replace(/</g, "\u003c").replace(/>/g, "\u003e").replace(/&/g, "\u0026");
}

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
      
      if (prodRes.data) products = prodRes.data;
      if (bannerRes.data) banners = bannerRes.data;
      if (siteInfoRes.data) siteSettings = siteInfoRes.data;

      // ── منطق اسلایدر هوشمند: اولویت با لیست پرفروش‌های تایید شده مدیر ──
      const layoutConfig = siteSettings?.homepage_layout_config || {};
      const sysSettings = layoutConfig?.system_settings || siteSettings?.settings || {};

      if (layoutConfig.approvedSliderBanners && layoutConfig.approvedSliderBanners.length > 0) {
        banners = layoutConfig.approvedSliderBanners; // جایگزینی اسلایدر با محصولات پرفروش تایید شده
      } 
      else if (sysSettings.smartSliderEnabled || layoutConfig.smartSliderEnabled) {
        // Fallback: اگر ادمین چیزی تایید نکرده بود ولی تیک اسلایدر هوشمند روشن بود، رندوم روزانه بیار
        const { data: sliderProds } = await supabaseAdmin.from("products").select("id, title, image, images, category").eq("is_available", true).limit(50);
        if (sliderProds && sliderProds.length > 0) {
          const cats = Array.from(new Set(sliderProds.map((p: any) => p.category))).filter(Boolean).slice(0, 5);
          const smartBanners = [];
          const daySeed = Math.floor(Date.now() / 86400000);
          for (const c of cats) {
            const catProds = sliderProds.filter((p: any) => p.category === c);
            if (catProds.length > 0) {
              const prod = catProds[daySeed % catProds.length];
              smartBanners.push({
                id: "smart-" + prod.id,
                title: prod.title,
                image_url: prod.image || (prod.images && prod.images[0]) || "/placeholder.png",
                link_url: `/products/${prod.id}`,
                is_active: true
              });
            }
          }
          if (smartBanners.length > 0) banners = smartBanners;
        }
      }
    }
  } catch (err) {}

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://axoncore.ir";
  const storeName = siteSettings?.storeName || siteSettings?.site_name || "آکسون کور | Axon Core";
  const phone = siteSettings?.phone ? String(siteSettings.phone).trim() : null;

  const organizationJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: baseUrl,
    logo: siteSettings?.logo_url || `${baseUrl}/favicon.ico`,
    description: siteSettings?.description || "فروشگاه آنلاین محصولات جدید",
    ...(phone && { contactPoint: { "@type": "ContactPoint", telephone: phone, contactType: "customer service", areaServed: "IR", availableLanguage: ["Persian", "English"] } }),
  };

  return (
    <div className="font-sans select-text text-[var(--text-primary)] space-y-12 pb-36 sm:pb-28 md:pb-8" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }} />
      <DynamicHomeSections initialProducts={products} initialBanners={banners} initialSiteInfo={siteSettings} />
    </div>
  );
}
