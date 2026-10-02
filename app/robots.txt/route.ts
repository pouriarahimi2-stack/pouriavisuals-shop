// File Path: app/robots.txt/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { normalizeSystemSettings } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const sys = normalizeSystemSettings(row?.homepage_layout_config);

    const content = sys.noIndex
      ? "User-agent: *\nDisallow: /\n"
      : "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://axoncore.ir/sitemap.xml\n";

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch {
    return new NextResponse(
      "User-agent: *\nAllow: /\nSitemap: https://axoncore.ir/sitemap.xml\n",
      {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }
}
