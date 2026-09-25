import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  let allowIndex = true;

  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("allow_google_index")
      .limit(1)
      .maybeSingle();
    if (data) allowIndex = data.allow_google_index !== false;
  } catch {}

  const content = allowIndex
    ? `User-agent: *
Allow: /
Sitemap: https://axoncore.ir/sitemap.xml`
    : `User-agent: *
Disallow: /`;

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
