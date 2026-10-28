import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const { orderId, phone } = await req.json();
    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) return NextResponse.json({ success: false }, { status: 400 });
    
    // شبیه‌سازی ارسال (اتصال واقعی به API پیامک)
    await supabaseAdmin.from("admin_audit_logs").insert([{
      action: "REVIEW_SMS_SENT",
      user_id: auth.session?.username || "admin",
      details: { orderId, targetMobile: cleanPhone },
      severity: "info",
    }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}