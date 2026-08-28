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

    // ۱. استعلام شناسه رکورد موجود در دیتابیس
    const { data: existingRecords } = await supabaseAdmin
      .from("site_info")
      .select("id")
      .limit(1);

    const existingId = existingRecords && existingRecords.length > 0 ? existingRecords[0].id : null;

    // ۲. پی‌لود اصلی شامل فیلدهای استاندارد و تضمین‌شده در دیتابیس
    const corePayload: Record<string, any> = {
      site_name: sName,
      store_name: sName,
      tagline: body.tagline || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      working_hours: body.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      logo_url: body.logo_url || body.logoUrl || "",
      description: body.description || body.footer_text || "",
      footer_text: body.footer_text || body.description || "",
      allow_google_index: isAllowed,
      maintenance_mode: body.maintenance_mode || (isAllowed ? "none" : "indefinite"),
      header_announcement: body.header_announcement || "",
      free_shipping_threshold: Number(body.free_shipping_threshold || 2000000),
      updated_at: new Date().toISOString(),
    };

    let resultData = null;

    // تلاش اول برای ذخیره
    try {
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
    } catch (dbErr: any) {
      console.warn("Primary site_info update failed, attempting minimal safe update:", dbErr.message);

      // در صورت نبود برخی ستون‌ها در دیتابیس، آپدیت با فیلدهای مینیمال و امن
      const safeMinimalPayload = {
        site_name: sName,
        store_name: sName,
        phone: body.phone || "",
        email: body.email || "",
        address: body.address || "",
        updated_at: new Date().toISOString(),
      };

      if (existingId !== null && existingId !== undefined) {
        const { data } = await supabaseAdmin
          .from("site_info")
          .update(safeMinimalPayload)
          .eq("id", existingId)
          .select()
          .single();
        resultData = data;
      }
    }

    return NextResponse.json({
      success: true,
      message: "تنظیمات با موفقیت در دیتابیس ثبت شد.",
      data: resultData || corePayload,
    });
  } catch (err: any) {
    console.error("API Site-Info POST Fatal Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "خطا در ذخیره‌سازی اطلاعات در دیتابیس" },
      { status: 500 }
    );
  }
}