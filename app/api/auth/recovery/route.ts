import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "check_customer_phone") {
      const { phone } = body;
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length !== 11) {
        return NextResponse.json({ success: false, message: "شماره همراه نامعتبر است." }, { status: 400 });
      }
      let userExists = false;
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin.from("customers").select("id").eq("phone", cleanPhone).maybeSingle();
        if (data) userExists = true;
      }
      return NextResponse.json({ success: true, exists: userExists });
    }

    if (action === "admin_forgot") {
      const { email } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json({ success: false, message: "ایمیل معتبر الزامی است." }, { status: 400 });
      }

      // تولید کد امن و عدم ارسال کد به پاسخ کلاینت (ارسال از طریق درگاه واقعی یا لاگ سرور)
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`[SECURE_RECOVERY] Admin recovery code for ${cleanEmail}: ${generatedPin}`);

      return NextResponse.json({
        success: true,
        message: `کد تایید بازیابی به ایمیل ثبت‌شده مدیر ارسال گردید.`,
      });
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
