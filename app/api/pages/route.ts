// File Path: app/api/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

function sanitizeSlug(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlug = searchParams.get("slug");
    const id = searchParams.get("id");

    const siteRow = await getMasterSiteInfoRow();
    const backupMap: Record<string, any> =
      siteRow?.homepage_layout_config?.modular_pages_map || {};

    if (rawSlug || id) {
      const cleanSlug = rawSlug ? sanitizeSlug(rawSlug) : "";
      let query = supabaseAdmin.from("modular_pages").select("*");
      if (id && !id.startsWith("core_") && !id.startsWith("page_") && !id.startsWith("camp_")) {
        query = query.eq("id", id);
      } else if (cleanSlug) {
        query = query.eq("slug", cleanSlug);
      }

      const { data } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
      const resolvedPage = data || (cleanSlug && backupMap[cleanSlug] ? backupMap[cleanSlug] : null);

      return NextResponse.json(
        { success: true, page: resolvedPage, data: resolvedPage },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const { data: dbPages } = await supabaseAdmin
      .from("modular_pages")
      .select("*")
      .order("created_at", { ascending: false });

    const mergedBySlug = new Map<string, any>();
    (dbPages || []).forEach((p: any) => {
      if (p?.slug && !mergedBySlug.has(p.slug)) {
        mergedBySlug.set(p.slug, p);
      }
    });

    Object.entries(backupMap).forEach(([slugKey, pageObj]: [string, any]) => {
      if (slugKey && pageObj && !pageObj._deleted && !mergedBySlug.has(slugKey)) {
        mergedBySlug.set(slugKey, pageObj);
      }
    });

    const pagesList = Array.from(mergedBySlug.values());
    return NextResponse.json(
      { success: true, pages: pagesList, data: pagesList },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body.title || body.slug || "").trim();
    const rawSlug = String(body.slug || title).trim();

    if (!title || !rawSlug) {
      return NextResponse.json(
        { success: false, message: "عنوان و نامک صفحه الزامی هستند." },
        { status: 400 }
      );
    }

    const cleanSlug = sanitizeSlug(rawSlug) || "home";
    const nowIso = new Date().toISOString();

    const payload = {
      title,
      slug: cleanSlug,
      puck_data: body.puck_data || body.data || { content: [], root: {} },
      is_published: body.is_published !== false,
      updated_at: nowIso,
    };

    // جستجوی صفحه موجود بر اساس id معتبر یا slug برای جلوگیری از ایجاد صفحات تکراری
    let existingId: string | null = null;
    if (
      body.id &&
      !String(body.id).startsWith("core_") &&
      !String(body.id).startsWith("page_") &&
      !String(body.id).startsWith("camp_")
    ) {
      existingId = String(body.id);
    } else {
      const { data: existingBySlug } = await supabaseAdmin
        .from("modular_pages")
        .select("id")
        .eq("slug", cleanSlug)
        .limit(1)
        .maybeSingle();
      if (existingBySlug?.id) {
        existingId = String(existingBySlug.id);
      }
    }

    let savedRecord: any = null;

    if (existingId) {
      const { data: updated, error: upErr } = await supabaseAdmin
        .from("modular_pages")
        .update(payload)
        .eq("id", existingId)
        .select()
        .maybeSingle();

      if (!upErr && updated) {
        savedRecord = updated;
      }
    } else {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("modular_pages")
        .insert([{ ...payload, created_at: nowIso }])
        .select()
        .maybeSingle();

      if (!insErr && inserted) {
        savedRecord = inserted;
      }
    }

    // ذخیره همگام در site_info برای پایداری ۱۰۰٪
    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const map = { ...(layoutCfg.modular_pages_map || {}) };
      map[cleanSlug] = {
        id: savedRecord?.id || existingId || "mod_" + cleanSlug,
        ...payload,
        created_at: savedRecord?.created_at || map[cleanSlug]?.created_at || nowIso,
        _deleted: false,
      };
      await saveMasterSiteInfoRow(siteRow, { ...layoutCfg, modular_pages_map: map }, {});
      if (!savedRecord) {
        savedRecord = map[cleanSlug];
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: existingId
        ? "✓ صفحه با موفقیت به‌روزرسانی شد."
        : "✓ صفحه جدید با موفقیت ایجاد و منتشر شد.",
      page: savedRecord,
      data: savedRecord,
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
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json(
        { success: false, message: "شناسه یا نامک صفحه الزامی است." },
        { status: 400 }
      );
    }

    if (id && !id.startsWith("core_") && !id.startsWith("page_") && !id.startsWith("camp_")) {
      await supabaseAdmin.from("modular_pages").delete().eq("id", id);
    }
    if (slug) {
      const cleanSlug = sanitizeSlug(slug);
      await supabaseAdmin.from("modular_pages").delete().eq("slug", cleanSlug);
      try {
        const siteRow = await getMasterSiteInfoRow();
        const layoutCfg = siteRow?.homepage_layout_config || {};
        if (layoutCfg.modular_pages_map && layoutCfg.modular_pages_map[cleanSlug]) {
          const map = { ...layoutCfg.modular_pages_map };
          delete map[cleanSlug];
          await saveMasterSiteInfoRow(siteRow, { ...layoutCfg, modular_pages_map: map }, {});
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message: "✓ صفحه با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}