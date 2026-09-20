import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const BANNERS_FILE = path.join(process.cwd(), "data", "banners.json");

function readLocalBanners(): any[] {
  try {
    if (fs.existsSync(BANNERS_FILE)) {
      const content = fs.readFileSync(BANNERS_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function writeLocalBanners(banners: any[]) {
  try {
    const dir = path.dirname(BANNERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BANNERS_FILE, JSON.stringify(banners, null, 2), "utf8");
  } catch (err) {
    console.error("Local banner write error:", err);
  }
}

export async function GET() {
  try {
    let list: any[] = readLocalBanners();

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from("banners").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          list = data;
          writeLocalBanners(data);
        }
      } catch {}

      if (list.length === 0) {
        try {
          const { data: siteRow } = await supabaseAdmin.from("site_info").select("homepage_layout_config").limit(1).maybeSingle();
          if (siteRow && (siteRow as any).homepage_layout_config && Array.isArray((siteRow as any).homepage_layout_config.banners)) {
            list = (siteRow as any).homepage_layout_config.banners;
            writeLocalBanners(list);
          }
        } catch {}
      }
    }

    return NextResponse.json({ success: true, banners: list });
  } catch {
    return NextResponse.json({ success: true, banners: readLocalBanners() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const imageUrl = String(body.image_url || body.image || "").trim();
    const linkUrl = String(body.link_url || body.link || "/products").trim();
    const isActive = body.is_active !== false;

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, message: "عنوان و تصویر بنر الزامی هستند." }, { status: 400 });
    }

    const bannerId = (body.id && String(body.id).length > 5) ? String(body.id) : randomUUID();

    const bannerRecord = {
      id: bannerId,
      title,
      image_url: imageUrl,
      link_url: linkUrl,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    let currentBanners = readLocalBanners();
    if (body.id) {
      currentBanners = currentBanners.map((b) => (String(b.id) === String(body.id) ? bannerRecord : b));
    } else {
      currentBanners = [bannerRecord, ...currentBanners];
    }
    writeLocalBanners(currentBanners);

    if (supabaseAdmin) {
      try {
        if (body.id) {
          await supabaseAdmin.from("banners").update(bannerRecord).eq("id", body.id);
        } else {
          await supabaseAdmin.from("banners").insert([bannerRecord]);
        }
      } catch {}

      try {
        const { data: siteRow } = await supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).maybeSingle();
        if (siteRow) {
          const cfg = (siteRow as any).homepage_layout_config || {};
          cfg.banners = currentBanners;
          await supabaseAdmin.from("site_info").update({ homepage_layout_config: cfg }).eq("id", siteRow.id);
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "بنر با موفقیت ثبت و ذخیره شد.",
      banner: bannerRecord,
      banners: currentBanners,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ثبت بنر." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });

    let current = readLocalBanners().filter((b) => String(b.id) !== String(id));
    writeLocalBanners(current);

    if (supabaseAdmin) {
      try { await supabaseAdmin.from("banners").delete().eq("id", id); } catch {}
      try {
        const { data: siteRow } = await supabaseAdmin.from("site_info").select("id, homepage_layout_config").limit(1).maybeSingle();
        if (siteRow && (siteRow as any).homepage_layout_config) {
          const cfg = (siteRow as any).homepage_layout_config;
          cfg.banners = current;
          await supabaseAdmin.from("site_info").update({ homepage_layout_config: cfg }).eq("id", siteRow.id);
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت حذف شد.", banners: current });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
