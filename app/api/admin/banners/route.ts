// File Path: app/api/admin/banners/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

async function getEnrichedBanners() {
  const [{ data: rawBanners }, siteRow] = await Promise.all([
    supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false }),
    getMasterSiteInfoRow(),
  ]);
  const metaMap = siteRow?.homepage_layout_config?.banners_meta_map || {};
  return (rawBanners || []).map((b: any) => {
    const extra = metaMap[String(b.id)] || {};
    return {
      ...b,
      subtitle: b.subtitle || extra.subtitle || "",
      cta_text: b.cta_text || extra.cta_text || "مشاهده و خرید",
      badge_text: b.badge_text || extra.badge_text || "پیشنهاد ویژه",
      target_devices: b.target_devices || extra.target_devices || "all",
    };
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const list = await getEnrichedBanners();
    return NextResponse.json({ success: true, banners: list, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const body = await req.json();
    const bannerId = body.id ? String(body.id) : randomUUID();
    const corePayload = {
      title: String(body.title || "").trim(),
      image_url: String(body.image_url || body.image || "").trim(),
      link_url: String(body.link_url || body.link || "/products").trim(),
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (!corePayload.title || !corePayload.image_url) {
      return NextResponse.json(
        { success: false, message: "عنوان و تصویر بنر الزامی است." },
        { status: 400 }
      );
    }

    if (body.id) {
      await supabaseAdmin.from("banners").update(corePayload).eq("id", bannerId);
    } else {
      await supabaseAdmin
        .from("banners")
        .insert([{ ...corePayload, id: bannerId, created_at: new Date().toISOString() }]);
    }

    // ذخیره اطلاعات تکمیلی بنر (زیرعنوان، متن دکمه، بج و دستگاه هدف) در متادیتای امن
    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const metaMap = { ...(layoutCfg.banners_meta_map || {}) };
      metaMap[bannerId] = {
        subtitle: String(body.subtitle || "").trim(),
        cta_text: String(body.cta_text || "مشاهده و خرید").trim(),
        badge_text: String(body.badge_text || "پیشنهاد ویژه").trim(),
        target_devices: body.target_devices || "all",
      };
      await saveMasterSiteInfoRow(siteRow, { ...layoutCfg, banners_meta_map: metaMap }, {});
    } catch {}

    const list = await getEnrichedBanners();
    return NextResponse.json({
      success: true,
      banners: list,
      data: list,
      message: "✓ بنر تبلیغاتی با موفقیت در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    }
    await supabaseAdmin.from("banners").delete().eq("id", id);
    const list = await getEnrichedBanners();
    return NextResponse.json({ success: true, banners: list, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
