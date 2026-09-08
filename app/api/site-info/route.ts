import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

    const payload: Record<string, any> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_info").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
