import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest) {
  let allow = true;
  try {
    const { data } = await supabaseAdmin.from("site_info").select("allow_google_index").limit(1).maybeSingle();
    if (data) allow = data.allow_google_index !== false;
  } catch {}
  const txt = allow ? "User-agent: *\nAllow: /\nSitemap: https://axoncore.ir/sitemap.xml" : "User-agent: *\nDisallow: /";
  return new NextResponse(txt, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
