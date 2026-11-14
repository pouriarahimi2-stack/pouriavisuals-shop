// File Path: app/robots.ts
import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = "https://axoncore.ir";

  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("allow_google_index, homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const layoutCfg = row?.homepage_layout_config || {};
    const sys = normalizeSystemSettings(layoutCfg);
    const techSeo = layoutCfg?.seo_technical_config || {};

    if (typeof techSeo.canonicalBaseUrl === "string" && techSeo.canonicalBaseUrl.startsWith("http")) {
      baseUrl = techSeo.canonicalBaseUrl.trim().replace(/\/+$/, "");
    }

    const indexDisabled =
      row?.allow_google_index === false ||
      sys.noIndex === true ||
      techSeo.allowGoogleIndex === false;

    if (indexDisabled) {
      return {
        rules: { userAgent: "*", disallow: "/" },
        sitemap: `${baseUrl}/sitemap.xml`,
      };
    }
  } catch {}

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/",
          "/blog",
          "/blog/",
          "/news",
          "/news/",
          "/about",
          "/contact",
          "/api/torob",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/api/admin/",
          "/api/auth/",
          "/api/payment/",
          "/api/checkout",
          "/_next/",
          "/checkout",
          "/checkout/",
          "/account",
          "/account/",
          "/my-orders",
          "/my-orders/",
          "/payment",
          "/payment/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/products/", "/blog/", "/news/", "/about", "/contact"],
        disallow: [
          "/admin/",
          "/api/admin/",
          "/checkout/",
          "/account/",
          "/my-orders/",
          "/payment/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}