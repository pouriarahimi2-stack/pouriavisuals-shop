// File Path: app/robots.txt/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axoncore.ir";
  let disallowAll = false;

  try {
    if (supabaseAdmin) {
      const { data: row } = await supabaseAdmin
        .from("site_info")
        .select("allow_google_index, maintenance_mode, homepage_layout_config")
        .limit(1)
        .maybeSingle();

      const sys = row?.homepage_layout_config?.auth_security_config?.system_settings;
      if (
        row?.allow_google_index === false ||
        (row?.maintenance_mode && row.maintenance_mode !== "none" && row.maintenance_mode !== "false") ||
        (sys && (sys.seo_noindex === true || sys.maintenance_mode === true))
      ) {
        disallowAll = true;
      }
    }
  } catch {}

  const content = disallowAll
    ? ["User-agent: *", "Disallow: /"].join("\n")
    : [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Disallow: /checkout/",
        "Disallow: /account/",
        "",
        "Sitemap: " + baseUrl + "/sitemap.xml",
      ].join("\n");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
