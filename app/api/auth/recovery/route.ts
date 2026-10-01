// File Path: app/api/auth/recovery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "check_customer_phone") {
      const { phone } = body;
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
        return NextResponse.json({ success: false, message: "شماره همراه نامعتبر است." }, { status: 400 });
      }
      let userExists = false;
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("phone", cleanPhone)
          .maybeSingle();
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

      const generatedPin = crypto.randomInt(100000, 999999).toString();
      const pinHash = crypto.createHash("sha256").update(generatedPin).digest("hex");
      const expiresAt = Date.now() + 5 * 60 * 1000;

      if (supabaseAdmin) {
        const { data: siteRow } = await supabaseAdmin
          .from("site_info")
          .select("id, support_phone, auth_security_config")
          .limit(1)
          .maybeSingle();

        if (siteRow && siteRow.id) {
          const currentConfig = siteRow.auth_security_config || {};
          await supabaseAdmin
            .from("site_info")
            .update({
              auth_security_config: {
                ...currentConfig,
                admin_recovery: {
                  email: cleanEmail,
                  pinHash,
                  expiresAt,
                  requestedAt: new Date().toISOString(),
                },
              },
            })
            .eq("id", siteRow.id);

          const adminPhone = String(siteRow.support_phone || "09376110200").replace(/\D/g, "");
          if (adminPhone.length === 11) {
            try {
              await smsService.sendSMS(
                adminPhone,
                "کد امنیتی بازیابی پنل مدیریت آکسون: " + generatedPin + " (اعتبار: ۵ دقیقه)"
              );
            } catch {}
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "کد تایید بازیابی به درگاه ارتباطی ثبت‌شده مدیر ارسال گردید.",
      });
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err && err.message ? err.message : "خطای سرور" }, { status: 500 });
  }
}
