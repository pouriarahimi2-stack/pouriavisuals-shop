// File Path: app/robots.ts
import { MetadataRoute } from "next";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = "https://axoncore.ir";

  try {
    const row = await getMasterSiteInfoRow();
    const layoutCfg = row?.homepage_layout_config || {};
    const sys = normalizeSystemSettings(layoutCfg, row);

    if (sys.canonicalBaseUrl && sys.canonicalBaseUrl.startsWith("http")) {
      baseUrl = sys.canonicalBaseUrl;
    }

    if (sys.noIndex || sys.disallowRobots) {
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