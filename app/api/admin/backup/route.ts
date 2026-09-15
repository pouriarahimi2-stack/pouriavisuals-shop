import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const [productsRes, ordersRes, siteInfoRes, bannersRes, newsRes, couponsRes] = await Promise.all([
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin.from("orders").select("*"),
      supabaseAdmin.from("site_info").select("*"),
      supabaseAdmin.from("banners").select("*"),
      supabaseAdmin.from("tech_news").select("*"),
      supabaseAdmin.from("coupons").select("*"),
    ]);

    const backupData = {
      meta: { app: "AXON CORE", timestamp: new Date().toISOString(), version: "2026.1" },
      data: {
        products: productsRes.data || [],
        orders: ordersRes.data || [],
        site_info: siteInfoRes.data || [],
        banners: bannersRes.data || [],
        tech_news: newsRes.data || [],
        coupons: couponsRes.data || [],
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="axon-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
