import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get("admin_session_token")?.value;
    if (!adminToken || adminToken.length < 20) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. لطفا ابتدا وارد پنل شوید." }, { status: 401 });
    }

    const body = await req.json();
    const { phone, discountPercent, couponCode } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ success: false, message: "شماره گیرنده نامعتبر است." }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace("+98", "0");
    const iranPhoneRegex = /^09\d{9}$/;
    if (!iranPhoneRegex.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل وارد شده معتبر نیست (الگوی صحیح: 09xxxxxxxxx)." }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
    
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_username: "admin",
        action: "SEND_DISCOUNT_SMS",
        target_resource: `customer:${cleanPhone}`,
        details: { discountPercent, couponCode },
        ip_address: clientIp,
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("[AUDIT_LOG_ERROR]:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: `پیامک تخفیف ${discountPercent || 10}٪ با کد ${couponCode || "اختصاصی"} با موفقیت ارسال شد.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در پردازش درخواست پیامک." }, { status: 500 });
  }
}
