// File Path: app/page.tsx
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import DynamicHomeSections from "@/components/DynamicHomeSections";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آکسون کور | فروشگاه مدرن محصولات تکنولوژی و گجت‌های هوشمند",
  description: "عرضه تخصصی جدیدترین محصولات تکنولوژی، گجت‌های دیجیتال و ابزارهای هوشمند با گارانتی اصالت طلایی و ارسال سریع به سراسر کشور.",
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

      // ── منطق اسلایدر هوشمند روزانه ──
      const sysSettings = siteSettings?.homepage_layout_config?.system_settings || siteSettings?.settings || {};
      if (sysSettings.smartSliderEnabled) {
        const { data: sliderProds } = await supabaseAdmin
          .from("products")
          .select("id, title, image, images, category")
          .eq("is_available", true)
          .limit(100);

        if (sliderProds && sliderProds.length > 0) {
          const cats = Array.from(new Set(sliderProds.map((p: any) => p.category))).filter(Boolean).slice(0, 5);
          const smartBanners = [];
          const daySeed = Math.floor(Date.now() / 86400000); // عدد روزانه منحصر به فرد

          for (const c of cats) {
            const catProds = sliderProds.filter((p: any) => p.category === c);
            if (catProds.length > 0) {
              const prod = catProds[daySeed % catProds.length]; // انتخاب چرخشی روزانه
              const imgUrl = prod.image || (prod.images && prod.images[0]) || "/placeholder.png";
              smartBanners.push({
                id: "smart-" + prod.id,
                title: prod.title,
                image_url: imgUrl,
                link_url: `/products/${prod.id}`,
                is_active: true
              });
            }
          }
          if (smartBanners.length > 0) {
            banners = smartBanners; // جایگزینی اسلایدر هوشمند با اسلایدر ثابت
          }
        }
      }
    }
  } catch (err) {
    console.warn("Home page fetch warning:", err);
  }

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
    ...(phone && {
      contactPoint: { "@type": "ContactPoint", telephone: phone, contactType: "customer service", areaServed: "IR", availableLanguage: ["Persian", "English"] },
    }),
  };

  return (
    <div className="font-sans select-text text-[var(--text-primary)] space-y-12 pb-32 sm:pb-8" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }} />
      <DynamicHomeSections initialProducts={products} initialBanners={banners} initialSiteInfo={siteSettings} />
    </div>
  );
}
