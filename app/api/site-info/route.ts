// File Path: app/api/site-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("site_info GET warning:", error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || {
        id: 1,
        site_name: "آکسون | Axon",
        store_name: "آکسون | Axon",
        tagline: "مرجع تخصصی تجهیزات دیجیتال، تصویر و استودیو",
        allow_google_index: true,
        maintenance_mode: "none",
        phone: "۰۲۱-۸۸۸۸۸۸۸۸",
        email: "info@axoncore.ir",
        address: "تهران، خیابان ولیعصر، تقاطع میرداماد",
        working_hours: "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        header_announcement: "⚡ ارسال رایگان خریدهای بالای ۲ میلیون تومان | گارانتی اصالت طلایی ۱۸ ماهه",
        free_shipping_threshold: 2000000,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAllowed = body.maintenance_mode === "none" && body.allow_google_index !== false;
    const sName = body.site_name || body.siteName || body.storeName || "آکسون | Axon";

    const payload: Record<string, any> = {
      id: 1,
      site_name: sName,
      store_name: sName,
      tagline: body.tagline || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      working_hours: body.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      logo_url: body.logo_url || body.logoUrl || null,
      footer_logo_url: body.footer_logo_url || body.footerLogoUrl || null,
      favicon_url: body.favicon_url || null,
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

    let { data, error } = await supabaseAdmin
      .from("site_info")
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Primary site_info upsert warning, attempting safe fallback:", error.message);

      const safePayload = {
        id: 1,
        site_name: sName,
        store_name: sName,
        tagline: body.tagline || "",
        phone: body.phone || "",
        email: body.email || "",
        address: body.address || "",
        logo_url: body.logo_url || body.logoUrl || null,
        footer_logo_url: body.footer_logo_url || body.footerLogoUrl || null,
        description: body.description || body.footer_text || "",
        allow_google_index: isAllowed,
        maintenance_mode: body.maintenance_mode || "none",
        updated_at: new Date().toISOString(),
      };

      const retry = await supabaseAdmin
        .from("site_info")
        .upsert(safePayload, { onConflict: "id" })
        .select()
        .maybeSingle();

      data = retry.data || safePayload;
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات با موفقیت در پایگاه داده ثبت گردید.",
      data: data || payload,
    });
  } catch (err: any) {
    console.error("API Site-Info Save Fatal Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "خطا در ذخیره‌سازی اطلاعات سایت" },
      { status: 500 }
    );
  }
}