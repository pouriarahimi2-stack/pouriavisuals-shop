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
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // خواندن رکورد قبلی جهت جلوگیری از رونویسی ناخواسته وضعیت تعمیرات
    const { data: existing } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    const maintMode = body.maintenance_mode !== undefined 
      ? body.maintenance_mode 
      : (existing?.maintenance_mode || "none");

    const isAllowed = body.allow_google_index !== undefined
      ? body.allow_google_index
      : (maintMode === "none");

    const sName = body.site_name || body.siteName || body.storeName || existing?.site_name || "آکسون | Axon";

    const payload: Record<string, any> = {
      id: existing?.id || 1,
      site_name: sName,
      store_name: sName,
      tagline: body.tagline !== undefined ? body.tagline : (existing?.tagline || ""),
      phone: body.phone !== undefined ? body.phone : (existing?.phone || ""),
      email: body.email !== undefined ? body.email : (existing?.email || ""),
      address: body.address !== undefined ? body.address : (existing?.address || ""),
      working_hours: body.working_hours !== undefined ? body.working_hours : (existing?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰"),
      logo_url: body.logo_url || body.logoUrl || existing?.logo_url || null,
      footer_logo_url: body.footer_logo_url || body.footerLogoUrl || existing?.footer_logo_url || null,
      favicon_url: body.favicon_url || body.faviconUrl || existing?.favicon_url || null,
      description: body.description || body.footer_text || existing?.description || "",
      footer_text: body.footer_text || body.description || existing?.footer_text || "",
      allow_google_index: isAllowed,
      maintenance_mode: maintMode,
      maintenance_until: body.maintenance_until !== undefined ? body.maintenance_until : (existing?.maintenance_until || null),
      maintenance_duration_minutes: body.maintenance_duration_minutes !== undefined ? body.maintenance_duration_minutes : (existing?.maintenance_duration_minutes || null),
      header_announcement: body.header_announcement !== undefined ? body.header_announcement : (existing?.header_announcement || ""),
      free_shipping_threshold: Number(body.free_shipping_threshold || existing?.free_shipping_threshold || 2000000),
      custom_css: body.custom_css !== undefined ? body.custom_css : (existing?.custom_css || ""),
      active_font_id: body.active_font_id || existing?.active_font_id || "Vazirmatn",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("site_info")
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ثبت شد", data: data || payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
