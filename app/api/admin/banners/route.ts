import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ success: true, banners: [] });
    const { data: banners } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, banners: banners || [] });
  } catch (err: any) {
    return NextResponse.json({ success: true, banners: [] });
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
      return NextResponse.json({ success: false, message: "عنوان و تصویر بنر الزامی است." }, { status: 400 });
    }

    const payload = {
      title,
      image_url: imageUrl,
      link_url: linkUrl,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (body.id && !String(body.id).startsWith("default-")) {
      await supabaseAdmin.from("banners").update(payload).eq("id", body.id);
    } else {
      await supabaseAdmin.from("banners").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت در پایگاه داده ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در ثبت بنر." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });

    if (supabaseAdmin && !id.startsWith("default-")) {
      await supabaseAdmin.from("banners").delete().eq("id", id);
    }
    return NextResponse.json({ success: true, message: "بنر با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
