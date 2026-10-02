import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

async function allBanners() {
  const { data } = await supabaseAdmin
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const list = await allBanners();
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
    const payload = {
      title: String(body.title || "").trim(),
      image_url: String(body.image_url || body.image || "").trim(),
      link_url: String(body.link_url || body.link || "/products").trim(),
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (!payload.title || !payload.image_url) {
      return NextResponse.json(
        { success: false, message: "عنوان و تصویر بنر الزامی است." },
        { status: 400 }
      );
    }

    if (body.id) {
      await supabaseAdmin.from("banners").update(payload).eq("id", body.id);
    } else {
      await supabaseAdmin
        .from("banners")
        .insert([{ ...payload, id: randomUUID(), created_at: new Date().toISOString() }]);
    }

    const list = await allBanners();
    return NextResponse.json({
      success: true,
      banners: list,
      data: list,
      message: "✓ بنر با موفقیت در دیتابیس ذخیره شد.",
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
    const list = await allBanners();
    return NextResponse.json({ success: true, banners: list, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
