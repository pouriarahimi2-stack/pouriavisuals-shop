// File Path: app/api/public/banners/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ data, error }, siteRow] = await Promise.all([
      supabaseAdmin
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      getMasterSiteInfoRow(),
    ]);
    if (error) throw error;
    const metaMap = siteRow?.homepage_layout_config?.banners_meta_map || {};
    const enriched = (data || []).map((b: any) => {
      const extra = metaMap[String(b.id)] || {};
      return {
        ...b,
        subtitle: b.subtitle || extra.subtitle || "",
        cta_text: b.cta_text || extra.cta_text || "مشاهده و خرید",
        badge_text: b.badge_text || extra.badge_text || "پیشنهاد ویژه",
        target_devices: b.target_devices || extra.target_devices || "all",
      };
    });
    return NextResponse.json(
      { success: true, banners: enriched, data: enriched },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, banners: [], data: [], message: err.message },
      { status: 200 }
    );
  }
}
