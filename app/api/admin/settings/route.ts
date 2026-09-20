import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings: any = {};
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
      if (data) settings = data;
    }
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = {
      site_name: body.site_name || "آکسون کور",
      store_name: body.store_name || body.site_name || "آکسون کور",
      phone: body.phone,
      email: body.email,
      address: body.address,
      working_hours: body.working_hours,
      allow_google_index: body.allow_google_index !== false,
      maintenance_mode: body.maintenance_mode || "none",
      header_announcement: body.maintenance_message || body.header_announcement,
      updated_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1).maybeSingle();
      if (existing?.id) {
        await supabaseAdmin.from("site_info").update(payload).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("site_info").insert([payload]);
      }
    }

    return NextResponse.json({ success: true, message: "تنظیمات عمومی با موفقیت در دیتابیس ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
