// File Path: app/page.tsx
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { unpackProductRow } from "@/lib/productUnpacker";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import DynamicHomeSections from "@/components/DynamicHomeSections";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteRow = await getMasterSiteInfoRow();
  const sys = normalizeSystemSettings(
    siteRow?.homepage_layout_config || {},
    siteRow
  );
  const baseUrl = (
    sys.canonicalBaseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://axoncore.ir"
  ).replace(/\/+$/, "");
  const siteName = sys.site_name || "آکسون کور | Axon Core";
  const tagline = sys.tagline || "";
  const title = tagline ? `${siteName} | ${tagline}` : siteName;
  const description =
    sys.meta_description ||
    sys.description ||
    `فروشگاه اینترنتی ${siteName}`;

  return {
    title,
    description,
    alternates: { canonical: baseUrl },
  };
}

function safeJsonLd(obj: Record<string, any>): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default async function HomePage() {
  let products: any[] = [];
  let banners: any[] = [];
  let siteSettings: any = null;

  try {
    if (supabaseAdmin) {
      const [prodRes, bannerRes, masterSite] = await Promise.all([
        supabaseAdmin
          .from("products")
          .select("*")
          .eq("is_available", true)
          .order("created_at", { ascending: false })
          .limit(24),
        supabaseAdmin
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6),
        getMasterSiteInfoRow(),
      ]);

      if (prodRes.data) {
        products = prodRes.data.map(unpackProductRow);
      }
      if (bannerRes.data) banners = bannerRes.data;
      if (masterSite) siteSettings = masterSite;

      const layoutConfig = siteSettings?.homepage_layout_config || {};
      const sysSettings =
        layoutConfig?.system_settings || siteSettings?.settings || {};

      if (
        layoutConfig.approvedSliderBanners &&
        layoutConfig.approvedSliderBanners.length > 0
      ) {
        banners = layoutConfig.approvedSliderBanners;
      } else if (
        sysSettings.smartSliderEnabled ||
        layoutConfig.smartSliderEnabled
      ) {
        const { data: sliderProds } = await supabaseAdmin
          .from("products")
          .select("id, title, image, image_url, images, category")
          .eq("is_available", true)
          .limit(50);
        if (sliderProds && sliderProds.length > 0) {
          const cats = Array.from(
            new Set(sliderProds.map((p: any) => p.category))
          )
            .filter(Boolean)
            .slice(0, 5);
          const smartBanners = [];
          const daySeed = Math.floor(Date.now() / 86400000);
          for (const c of cats) {
            const catProds = sliderProds.filter((p: any) => p.category === c);
            if (catProds.length > 0) {
              const prod = catProds[daySeed % catProds.length];
              smartBanners.push({
                id: "smart-" + prod.id,
                title: prod.title,
                image_url:
                  prod.image_url ||
                  prod.image ||
                  (prod.images && prod.images[0]) ||
                  "/placeholder.png",
                link_url: `/products/${prod.id}`,
                is_active: true,
              });
            }
          }
          if (smartBanners.length > 0) banners = smartBanners;
        }
      }
    }
  } catch {}

  const sys = normalizeSystemSettings(
    siteSettings?.homepage_layout_config || {},
    siteSettings
  );
  const baseUrl = (
    sys.canonicalBaseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://axoncore.ir"
  ).replace(/\/+$/, "");
  const storeName = sys.site_name || "آکسون کور | Axon Core";
  const phone = sys.phone ? String(sys.phone).trim() : null;

  const organizationJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: baseUrl,
    logo: sys.logo_url || `${baseUrl}/favicon.ico`,
    description: sys.description || storeName,
    ...(phone && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "customer service",
        areaServed: "IR",
        availableLanguage: ["Persian", "English"],
      },
    }),
  };

  return (
    <div
      className="font-sans select-text text-[var(--text-primary)] space-y-12 pb-36 sm:pb-28 md:pb-8"
      dir="rtl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
      />
      <DynamicHomeSections
        initialProducts={products}
        initialBanners={banners}
        initialSiteInfo={siteSettings}
      />
    </div>
  );
}