import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { data } = await supabaseAdmin.from("site_info").select("homepage_layout_config").limit(1).maybeSingle();
    const links = data?.homepage_layout_config?.footer?.quickLinks || [
      { title: "قوانین و مقررات", url: "/terms" },
      { title: "تماس با ما", url: "/contact" }
    ];
    return NextResponse.json({ success: true, links });
  } catch (e) {
    return NextResponse.json({ success: false, links: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await verifyAdminSession(req);
    if (!isAuth) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const { links } = await req.json();
    const { data: siteRow } = await supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).maybeSingle();

    if (siteRow && siteRow.id) {
      const layoutCfg = siteRow.homepage_layout_config || {};
      const footerCfg = layoutCfg.footer || {};
      await supabaseAdmin.from("site_info").update({
        homepage_layout_config: { ...layoutCfg, footer: { ...footerCfg, quickLinks: links } }
      }).eq("id", siteRow.id);
    }
    return NextResponse.json({ success: true, message: "لینک‌های فوتر با موفقیت ذخیره شدند." });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
