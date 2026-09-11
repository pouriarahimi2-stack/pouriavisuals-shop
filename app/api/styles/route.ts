import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { enforceRbac } from "@/lib/rbacGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from("site_styles").select("*").limit(1).maybeSingle();
    return NextResponse.json({
      success: true,
      data: data || {
        primary_color: "#0071e3",
        secondary_color: "#4f46e5",
        font_family: "Vazirmatn",
        border_radius: "1.5rem",
        custom_css: "",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    if (!enforceRbac(session.role, "styles.manage") && session.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "نقش کاربری شما اجازه تغییر هویت بصری و استایل‌های سایت را ندارد." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const payload = {
      primary_color: body.primary_color || "#0071e3",
      secondary_color: body.secondary_color || "#4f46e5",
      font_family: body.font_family || "Vazirmatn",
      border_radius: body.border_radius || "1.5rem",
      custom_css: body.custom_css || "",
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("site_styles").select("id").limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_styles").update(payload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_styles").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "استایل‌ها و هویت بصری با موفقیت در دیتابیس ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
