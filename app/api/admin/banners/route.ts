import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ success: true, banners: [] });
    const { data: banners, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ success: true, banners: [] });
    return NextResponse.json({ success: true, banners: banners || [] });
  } catch (err: any) {
    return NextResponse.json({ success: true, banners: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const imageUrl = String(body.image || body.image_url || "").trim();

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, message: "عنوان و تصویر بنر الزامی است." }, { status: 400 });
    }

    const payload: Record<string, any> = {
      title,
      image_url: imageUrl,
      link_url: body.link_url || body.link || "/products",
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      if (body.id && !String(body.id).startsWith("default-")) {
        await supabaseAdmin.from("banners").update(payload).eq("id", body.id);
      } else {
        payload.created_at = new Date().toISOString();
        await supabaseAdmin.from("banners").insert([payload]);
      }
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در ثبت بنر." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });

    if (supabaseAdmin && !id.startsWith("default-")) {
      await supabaseAdmin.from("banners").delete().eq("id", id);
    }
    return NextResponse.json({ success: true, message: "بنر با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
