// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAllowed = body.maintenance_mode === "none" && body.allow_google_index !== false;
    const sName = body.site_name || body.siteName || body.storeName || "آکسون | Axon";

    const { data: existingRecords } = await supabaseAdmin
      .from("site_info")
      .select("id")
      .limit(1);

    const existingId = existingRecords && existingRecords.length > 0 ? existingRecords[0].id : null;

    const corePayload: Record<string, any> = {
      site_name: sName,
      store_name: sName,
      tagline: body.tagline || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      working_hours: body.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      logo_url: body.logo_url || body.logoUrl || "",
      footer_logo_url: body.footer_logo_url || body.footerLogoUrl || "",
      description: body.description || body.footer_text || "",
      footer_text: body.footer_text || body.description || "",
      allow_google_index: isAllowed,
      maintenance_mode: body.maintenance_mode || (isAllowed ? "none" : "indefinite"),
      maintenance_until: body.maintenance_until || null,
      maintenance_duration_minutes: body.maintenance_duration_minutes || null,
      header_announcement: body.header_announcement || "",
      free_shipping_threshold: Number(body.free_shipping_threshold || 2000000),
      custom_css: body.custom_css || "",
      active_font_id: body.active_font_id || "Vazirmatn",
      instagram: body.instagram || "",
      telegram: body.telegram || "",
      whatsapp: body.whatsapp || "",
      youtube: body.youtube || "",
      updated_at: new Date().toISOString(),
    };

    let resultData = null;

    if (existingId !== null && existingId !== undefined) {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .update(corePayload)
        .eq("id", existingId)
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("site_info")
        .insert([corePayload])
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات با موفقیت در دیتابیس ثبت و فعال گردید.",
      data: resultData || corePayload,
    });
  } catch (err: any) {
    console.error("API Site-Info POST Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "خطا در ذخیره‌سازی اطلاعات" },
      { status: 500 }
    );
  }
}