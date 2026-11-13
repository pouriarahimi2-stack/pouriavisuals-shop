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

    if (error) {
      console.warn("Public banners table warning:", error.message);
    }

    const metaMap: Record<string, any> =
      siteRow?.homepage_layout_config?.banners_meta_map || {};
    const seenIds = new Set<string>();
    const enriched: any[] = [];

    (data || []).forEach((b: any) => {
      const idStr = String(b.id);
      seenIds.add(idStr);
      const extra = metaMap[idStr] || {};
      if (extra._deleted || b.is_active === false || extra.is_active === false) return;

      const imgUrl = b.image_url || b.image || extra.image_url || "";
      const lnkUrl = b.link_url || b.link || extra.link_url || "/products";
      if (!imgUrl) return;

      enriched.push({
        ...b,
        id: idStr,
        title: b.title || extra.title || "",
        subtitle: b.subtitle ?? extra.subtitle ?? "",
        image_url: imgUrl,
        image: imgUrl,
        link_url: lnkUrl,
        link: lnkUrl,
        cta_text: b.cta_text || extra.cta_text || "مشاهده و خرید",
        badge_text: b.badge_text || extra.badge_text || "پیشنهاد ویژه",
        target_devices: b.target_devices || extra.target_devices || "all",
        sort_order: Number(b.sort_order ?? extra.sort_order ?? 0),
        is_active: true,
        created_at: b.created_at || extra.created_at || new Date().toISOString(),
      });
    });

    Object.entries(metaMap).forEach(([idStr, extra]: [string, any]) => {
      if (
        !seenIds.has(idStr) &&
        extra &&
        !extra._deleted &&
        extra.is_active !== false &&
        extra.title &&
        extra.image_url
      ) {
        enriched.push({
          id: idStr,
          title: extra.title,
          subtitle: extra.subtitle || "",
          image_url: extra.image_url,
          image: extra.image_url,
          link_url: extra.link_url || "/products",
          link: extra.link_url || "/products",
          cta_text: extra.cta_text || "مشاهده و خرید",
          badge_text: extra.badge_text || "پیشنهاد ویژه",
          target_devices: extra.target_devices || "all",
          sort_order: Number(extra.sort_order ?? 0),
          is_active: true,
          created_at: extra.created_at || new Date().toISOString(),
        });
      }
    });

    enriched.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
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