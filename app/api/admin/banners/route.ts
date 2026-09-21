import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/authSecurityHelper";
import fs from "fs";

export const dynamic = "force-dynamic";

const TMP_BANNERS_FILE = "/tmp/axon_banners.json";

function readTmpBanners(): any[] {
  try {
    const content = fs.readFileSync(TMP_BANNERS_FILE, "utf8");
    const parsed  = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTmpBanners(banners: any[]) {
  try {
    fs.writeFileSync(TMP_BANNERS_FILE, JSON.stringify(banners, null, 2), "utf8");
  } catch {}
}

async function getBannersFromSiteInfo(): Promise<any[]> {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();
    if (data?.homepage_layout_config?.banners) {
      return Array.isArray(data.homepage_layout_config.banners)
        ? data.homepage_layout_config.banners
        : [];
    }
  } catch {}
  return [];
}

async function saveBannersToSiteInfo(banners: any[]) {
  try {
    const { data: row } = await supabaseAdmin
      .from("site_info")
      .select("id, homepage_layout_config")
      .limit(1)
      .maybeSingle();
    if (row) {
      const cfg   = row.homepage_layout_config || {};
      cfg.banners = banners;
      await supabaseAdmin
        .from("site_info")
        .update({ homepage_layout_config: cfg })
        .eq("id", row.id);
    }
  } catch {}
}

// ── GET ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    // اولویت ۱: جدول banners (اگر در Supabase ایجاد شده باشد)
    const { data: supabanners, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && supabanners && supabanners.length > 0) {
      writeTmpBanners(supabanners);
      return NextResponse.json({ success: true, banners: supabanners });
    }

    // اولویت ۲: site_info JSONB
    const siBanners = await getBannersFromSiteInfo();
    if (siBanners.length > 0) {
      writeTmpBanners(siBanners);
      return NextResponse.json({ success: true, banners: siBanners });
    }

    // اولویت ۳: فایل /tmp
    return NextResponse.json({ success: true, banners: readTmpBanners() });
  } catch {
    return NextResponse.json({ success: true, banners: readTmpBanners() });
  }
}

// ── POST ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "فرمت درخواست نامعتبر است (JSON parse error)." },
        { status: 400 }
      );
    }

    const title    = String(body.title     || "").trim();
    const imageUrl = String(body.image_url || body.image || "").trim();
    const linkUrl  = String(body.link_url  || body.link  || "/products").trim();
    const isActive = body.is_active !== false;

    if (!title) {
      return NextResponse.json(
        { success: false, message: "عنوان بنر الزامی است." },
        { status: 400 }
      );
    }
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: "تصویر بنر الزامی است. ابتدا یک عکس انتخاب کنید." },
        { status: 400 }
      );
    }

    const isEdit   = body.id && String(body.id).trim().length > 5 && body.id !== "undefined";
    const bannerId = isEdit ? String(body.id).trim() : randomUUID();
    const now      = new Date().toISOString();

    const bannerRecord = {
      id:         bannerId,
      title,
      image_url:  imageUrl,
      link_url:   linkUrl,
      is_active:  isActive,
      updated_at: now,
      created_at: isEdit ? (body.created_at || now) : now,
    };

    let allBanners = readTmpBanners();
    if (allBanners.length === 0) {
      allBanners = await getBannersFromSiteInfo();
    }

    if (isEdit) {
      allBanners = allBanners.map((b) => String(b.id) === bannerId ? bannerRecord : b);
    } else {
      allBanners = [bannerRecord, ...allBanners];
    }

    writeTmpBanners(allBanners);
    await saveBannersToSiteInfo(allBanners);

    try {
      if (isEdit) {
        await supabaseAdmin.from("banners").update(bannerRecord).eq("id", bannerId);
      } else {
        await supabaseAdmin.from("banners").insert([bannerRecord]);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: isEdit ? "✓ بنر ویرایش شد." : "✓ بنر جدید ثبت شد.",
      banner:  bannerRecord,
      banners: allBanners,
    });
  } catch (err: any) {
    console.error("Banners POST error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت بنر." },
      { status: 500 }
    );
  }
}

// ── DELETE ───────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه بنر الزامی است." },
        { status: 400 }
      );
    }

    let allBanners = readTmpBanners();
    if (allBanners.length === 0) allBanners = await getBannersFromSiteInfo();
    const filtered = allBanners.filter((b) => String(b.id) !== String(id));

    writeTmpBanners(filtered);
    await saveBannersToSiteInfo(filtered);
    try { await supabaseAdmin.from("banners").delete().eq("id", id); } catch {}

    return NextResponse.json({
      success: true,
      message: "✓ بنر حذف شد.",
      banners: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
