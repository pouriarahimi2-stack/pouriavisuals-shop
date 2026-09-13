import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAdminAuth(req: NextRequest) {
  const adminToken = req.cookies.get("admin_session_token")?.value;
  return Boolean(adminToken && adminToken.length >= 20);
}

// ۱. دریافت تنظیمات جاری سایت (GET)
export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: settings || {},
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در دریافت تنظیمات سایت." },
      { status: 500 }
    );
  }
}

// ۲. ذخیره و به‌روزرسانی تنظیمات با ثبت امنیتی (POST)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { site_title, phone, address, instagram, telegram, footer_text, enamad_code, id } = body;

    const payload: Record<string, any> = {
      site_title: typeof site_title === "string" ? site_title.trim() : "Axon Core",
      phone: typeof phone === "string" ? phone.trim() : null,
      address: typeof address === "string" ? address.trim() : null,
      instagram: typeof instagram === "string" ? instagram.trim() : null,
      telegram: typeof telegram === "string" ? telegram.trim() : null,
      footer_text: typeof footer_text === "string" ? footer_text.trim() : null,
      enamad_code: typeof enamad_code === "string" ? enamad_code.trim() : null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
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
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
    }

    // ثبت تغییر تنظیمات در جدول لاگ‌های امنیتی
    try {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "local";

      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_username: "admin",
        action: "UPDATE_SITE_SETTINGS",
        target_resource: "site_info",
        details: payload,
        ip_address: clientIp,
        created_at: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.error("[AUDIT_LOG_ERROR]:", auditErr);
    }

    return NextResponse.json({
      success: true,
      settings: result,
      message: "تنظیمات فروشگاه با موفقیت ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ذخیره تنظیمات." },
      { status: 500 }
    );
  }
}
