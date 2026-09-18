import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data: banners, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, banners: banners || [] });
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
    const title = String(body.title || "").trim();
    const imageUrl = String(body.image || body.image_url || "").trim();

    if (!title || !imageUrl) {
      return NextResponse.json({ success: false, message: "عنوان و تصویر بنر الزامی هستند." }, { status: 400 });
    }

    const payload = {
      title,
      subtitle: body.subtitle ? String(body.subtitle).trim() : null,
      badge: body.badge || body.badge_text ? String(body.badge || body.badge_text).trim() : null,
      badge_text: body.badge || body.badge_text ? String(body.badge || body.badge_text).trim() : null,
      image: imageUrl,
      image_url: imageUrl,
      link: body.link || body.link_url || "/products",
      link_url: body.link || body.link_url || "/products",
      button_text: body.button_text || body.buttonText || "مشاهده و بررسی کالا",
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id && !String(body.id).startsWith("default-")) {
      const { data: updated, error } = await supabaseAdmin
        .from("banners")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "بنر با موفقیت به‌روزرسانی شد.", banner: updated });
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("banners")
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: "بنر جدید با موفقیت ایجاد شد.", banner: inserted });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });
    }

    if (!id.startsWith("default-")) {
      const { error } = await supabaseAdmin.from("banners").delete().eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
