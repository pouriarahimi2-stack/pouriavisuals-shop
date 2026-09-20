import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ success: true, banners: [] });
    const { data: banners, error } = await supabaseAdmin
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // فال‌بک امن در صورت نبود جدول
      return NextResponse.json({ success: true, banners: [] });
    }
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
      return NextResponse.json({ success: false, message: "عنوان و تصویر بنر الزامی هستند." }, { status: 400 });
    }

    // استفاده از UUID استاندارد نسخه ۴ جهت عدم ارور syntax error در Postgres
    const bannerId = (body.id && body.id.length === 36) ? body.id : randomUUID();

    const payload: Record<string, any> = {
      id: bannerId,
      title,
      image_url: imageUrl,
      link_url: linkUrl,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      if (body.id) {
        const { error: updErr } = await supabaseAdmin.from("banners").update(payload).eq("id", body.id);
        if (updErr) {
          // فال‌بک برای حالتی که ستون بدون خط تیره link باشد
          await supabaseAdmin.from("banners").update({
            title,
            image_url: imageUrl,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          }).eq("id", body.id);
        }
      } else {
        payload.created_at = new Date().toISOString();
        const { error: insErr } = await supabaseAdmin.from("banners").insert([payload]);
        if (insErr) {
          // اگر ستون link_url در ساختار جدول وجود نداشت
          await supabaseAdmin.from("banners").insert([{
            id: bannerId,
            title,
            image_url: imageUrl,
            is_active: isActive,
            created_at: new Date().toISOString(),
          }]);
        }
      }
    }

    return NextResponse.json({ success: true, message: "بنر با موفقیت در دیتابیس ثبت شد.", banner: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ثبت بنر." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه بنر الزامی است." }, { status: 400 });

    if (supabaseAdmin) {
      await supabaseAdmin.from("banners").delete().eq("id", id);
    }
    return NextResponse.json({ success: true, message: "بنر با موفقیت حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
