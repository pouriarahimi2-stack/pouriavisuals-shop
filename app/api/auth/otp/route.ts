// File Path: app/api/auth/otp/route.ts
import { NextResponse } from "next/server";
import { sendOtpPattern } from "@/lib/otpService";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashOtp(mobile: string, code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "axon-otp-secret-key";
  return crypto.createHmac("sha256", secret).update(mobile + ":" + code).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawMobile = String(body.mobile || body.phone || "").replace(/\D/g, "");
    const action = body.action || "send";

    if (!rawMobile || rawMobile.length !== 11 || !rawMobile.startsWith("09")) {
      return NextResponse.json(
        { success: false, error: "شماره موبایل معتبر نیست. شماره باید ۱۱ رقمی و با ۰۹ شروع شود." },
        { status: 400 }
      );
    }

    if (action === "verify") {
      const code = String(body.code || "").trim();
      if (!code || code.length < 4) {
        return NextResponse.json(
          { success: false, verified: false, error: "کد تایید وارد شده نامعتبر است." },
          { status: 400 }
        );
      }

      const expectedHash = hashOtp(rawMobile, code);

      if (supabaseAdmin) {
        const { data: siteRow } = await supabaseAdmin
          .from("site_info")
          .select("id, auth_security_config")
          .limit(1)
          .maybeSingle();

        const otpStore = (siteRow && siteRow.auth_security_config && siteRow.auth_security_config.active_otps)
          ? siteRow.auth_security_config.active_otps
          : {};
        const record = otpStore[rawMobile];

        if (!record || !record.hash || !record.expiresAt) {
          return NextResponse.json(
            { success: false, verified: false, error: "کد تاییدی برای این شماره یافت نشد یا منقضی شده است." },
            { status: 400 }
          );
        }

        if (Date.now() > Number(record.expiresAt)) {
          return NextResponse.json(
            { success: false, verified: false, error: "مهلت ۲ دقیقه‌ای کد تایید به پایان رسیده است." },
            { status: 400 }
          );
        }

        if (record.hash !== expectedHash) {
          return NextResponse.json(
            { success: false, verified: false, error: "کد تایید وارد شده اشتباه است." },
            { status: 400 }
          );
        }

        if (siteRow && siteRow.id) {
          const updatedOtps = { ...otpStore };
          delete updatedOtps[rawMobile];
          await supabaseAdmin
            .from("site_info")
            .update({
              auth_security_config: {
                ...(siteRow.auth_security_config || {}),
                active_otps: updatedOtps,
              },
            })
            .eq("id", siteRow.id);
        }
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: "کد تایید با موفقیت اعتبارسنجی شد.",
      });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 2 * 60 * 1000;
    const codeHash = hashOtp(rawMobile, otpCode);

    if (supabaseAdmin) {
      const { data: siteRow } = await supabaseAdmin
        .from("site_info")
        .select("id, auth_security_config")
        .limit(1)
        .maybeSingle();

      if (siteRow && siteRow.id) {
        const currentConfig = siteRow.auth_security_config || {};
        const activeOtps = currentConfig.active_otps || {};

        const now = Date.now();
        Object.keys(activeOtps).forEach((key) => {
          if (activeOtps[key] && activeOtps[key].expiresAt && now > activeOtps[key].expiresAt) {
            delete activeOtps[key];
          }
        });

        activeOtps[rawMobile] = {
          hash: codeHash,
          expiresAt,
          createdAt: now,
        };

        await supabaseAdmin
          .from("site_info")
          .update({
            auth_security_config: {
              ...currentConfig,
              active_otps: activeOtps,
            },
          })
          .eq("id", siteRow.id);
      }
    }

    const isSent = await sendOtpPattern({ mobile: rawMobile, code: otpCode });

    if (!isSent) {
      return NextResponse.json(
        { success: false, error: "خطا در ارسال پیامک از طریق سامانه رخ داد." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expiresInSeconds: 120,
      message: "کد تایید با موفقیت ارسال شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err && err.message ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
