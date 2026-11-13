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

  const metaMap: Record<string, any> =
    siteRow?.homepage_layout_config?.banners_meta_map || {};
  const seenIds = new Set<string>();
  const combined: any[] = [];

  (rawBanners || []).forEach((b: any) => {
    const idStr = String(b.id);
    seenIds.add(idStr);
    const extra = metaMap[idStr] || {};
    const imgUrl = b.image_url || b.image || extra.image_url || "";
    const lnkUrl = b.link_url || b.link || extra.link_url || "/products";

    combined.push({
      ...b,
      id: idStr,
      title: b.title || extra.title || "بنر تبلیغاتی",
      subtitle: b.subtitle ?? extra.subtitle ?? "",
      image_url: imgUrl,
      image: imgUrl,
      link_url: lnkUrl,
      link: lnkUrl,
      cta_text: b.cta_text || extra.cta_text || "مشاهده و خرید",
      badge_text: b.badge_text || extra.badge_text || "پیشنهاد ویژه",
      target_devices: b.target_devices || extra.target_devices || "all",
      sort_order: Number(b.sort_order ?? extra.sort_order ?? 0),
      is_active:
        b.is_active !== undefined
          ? Boolean(b.is_active)
          : extra.is_active !== undefined
          ? Boolean(extra.is_active)
          : true,
      created_at: b.created_at || extra.created_at || new Date().toISOString(),
    });
  });

  // اگر بنری در متادیتای امن ذخیره شده اما در جدول banners نبود، بازیابی شود
  Object.entries(metaMap).forEach(([idStr, extra]: [string, any]) => {
    if (!seenIds.has(idStr) && extra && extra.title && extra.image_url && !extra._deleted) {
      combined.push({
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
        is_active: extra.is_active !== false,
        created_at: extra.created_at || new Date().toISOString(),
      });
    }
  });

  combined.sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return combined;
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
    const isEditing = Boolean(body.id);
    const bannerId = body.id ? String(body.id) : randomUUID();
    const nowIso = new Date().toISOString();

    const cleanTitle = String(body.title || "").trim();
    const cleanImage = String(body.image_url || body.image || "").trim();
    const cleanLink = String(body.link_url || body.link || "/products").trim() || "/products";
    const cleanSubtitle = String(body.subtitle || "").trim();
    const cleanCta = String(body.cta_text || "مشاهده و خرید").trim() || "مشاهده و خرید";
    const cleanBadge = String(body.badge_text || "پیشنهاد ویژه").trim() || "پیشنهاد ویژه";
    const isActive = body.is_active !== false;
    const sortOrder = Number(body.sort_order ?? 0);

    if (!cleanTitle || !cleanImage) {
      return NextResponse.json(
        { success: false, message: "عنوان و تصویر بنر الزامی است." },
        { status: 400 }
      );
    }

    const corePayload: Record<string, any> = {
      title: cleanTitle,
      image_url: cleanImage,
      link_url: cleanLink,
      is_active: isActive,
      updated_at: nowIso,
    };

    if (isEditing) {
      const { error: upErr } = await supabaseAdmin
        .from("banners")
        .update(corePayload)
        .eq("id", bannerId);

      if (upErr) {
        // تلاش مجدد بدون ستون updated_at در صورت عدم وجود در اسکیمای جدول
        const { updated_at, ...minimalUpdate } = corePayload;
        await supabaseAdmin.from("banners").update(minimalUpdate).eq("id", bannerId);
      }
    } else {
      const { error: insErr } = await supabaseAdmin
        .from("banners")
        .insert([{ ...corePayload, id: bannerId, created_at: nowIso }]);

      if (insErr) {
        const { updated_at, ...minimalInsert } = corePayload;
        await supabaseAdmin
          .from("banners")
          .insert([{ ...minimalInsert, id: bannerId, created_at: nowIso }]);
      }
    }

    // ذخیره کامل مشخصات و متادیتای بنر در site_info برای پایداری ۱۰۰٪
    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const metaMap = { ...(layoutCfg.banners_meta_map || {}) };
      const prevMeta = metaMap[bannerId] || {};

      metaMap[bannerId] = {
        ...prevMeta,
        id: bannerId,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        image_url: cleanImage,
        link_url: cleanLink,
        cta_text: cleanCta,
        badge_text: cleanBadge,
        target_devices: body.target_devices || prevMeta.target_devices || "all",
        sort_order: sortOrder,
        is_active: isActive,
        created_at: prevMeta.created_at || nowIso,
        updated_at: nowIso,
        _deleted: false,
      };
      await saveMasterSiteInfoRow(siteRow, { ...layoutCfg, banners_meta_map: metaMap }, {});
    } catch (metaErr) {
      console.warn("Banner metadata save warning:", metaErr);
    }

    const list = await getEnrichedBanners();
    return NextResponse.json({
      success: true,
      banners: list,
      data: list,
      message: isEditing
        ? "✓ بنر تبلیغاتی با موفقیت بروزرسانی شد."
        : "✓ بنر تبلیغاتی جدید با موفقیت در دیتابیس ذخیره و فعال شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
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

    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      if (layoutCfg.banners_meta_map && layoutCfg.banners_meta_map[id]) {
        const metaMap = { ...layoutCfg.banners_meta_map };
        delete metaMap[id];
        await saveMasterSiteInfoRow(siteRow, { ...layoutCfg, banners_meta_map: metaMap }, {});
      }
    } catch {}

    const list = await getEnrichedBanners();
    return NextResponse.json({
      success: true,
      banners: list,
      data: list,
      message: "✓ بنر با موفقیت حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}