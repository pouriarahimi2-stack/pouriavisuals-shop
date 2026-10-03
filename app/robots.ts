// File Path: app/robots.ts
import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const sys = normalizeSystemSettings(row?.homepage_layout_config);

    if (sys.noIndex) {
      return {
        rules: {
          userAgent: "*",
          disallow: "/",
        },
      };
    }
  } catch {}

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: "https://axoncore.ir/sitemap.xml",
  };
}
