import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const { data: settings } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ success: true, settings: settings || {} });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();

    // پیلود کامل — تمام فیلدهای تنظیمات را پوشش می‌دهد
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // اطلاعات پایه فروشگاه
    if (body.site_name   !== undefined) payload.site_name      = String(body.site_name).trim();
    if (body.site_title  !== undefined) payload.site_name      = String(body.site_title).trim();
    if (body.phone       !== undefined) payload.phone          = String(body.phone).trim();
    if (body.email       !== undefined) payload.email          = String(body.email).trim();
    if (body.address     !== undefined) payload.address        = String(body.address).trim();
    if (body.working_hours !== undefined) payload.working_hours = String(body.working_hours).trim();
    if (body.instagram   !== undefined) payload.instagram      = String(body.instagram).trim();
    if (body.telegram    !== undefined) payload.telegram       = String(body.telegram).trim();
    if (body.whatsapp    !== undefined) payload.whatsapp       = String(body.whatsapp).trim();
    if (body.footer_text !== undefined) payload.footer_text    = String(body.footer_text).trim();

    // تنظیمات SEO و دسترسی گوگل
    if (body.allow_google_index !== undefined) {
      payload.allow_google_index = Boolean(body.allow_google_index);
    }

    // حالت تعمیرات
    if (body.maintenance_mode !== undefined) {
      payload.maintenance_mode = String(body.maintenance_mode);
    }

    // پیام حالت تعمیرات (در فیلد header_announcement ذخیره می‌شود)
    if (body.maintenance_message !== undefined) {
      payload.header_announcement = String(body.maintenance_message).trim();
    }
    if (body.header_announcement !== undefined) {
      payload.header_announcement = String(body.header_announcement).trim();
    }

    // آستانه ارسال رایگان
    if (body.free_shipping_threshold !== undefined) {
      payload.free_shipping_threshold = Number(body.free_shipping_threshold) || 0;
    }

    // ── Upsert ─────────────────────────────────────────────────
    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("id")
      .limit(1)
      .maybeSingle();

    let result;
    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      settings: result,
      message: "✓ تمامی تنظیمات با موفقیت در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ذخیره تنظیمات." },
      { status: 500 }
    );
  }
}
