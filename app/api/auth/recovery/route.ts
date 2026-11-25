// File Path: app/api/auth/recovery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { smsService } from "@/services/smsService";
import { rateLimiter } from "@/lib/rateLimiter";
import {
  getMasterSiteInfoRow,
  saveMasterSiteInfoRow,
} from "@/lib/siteInfoPersistence";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { verifyPhoneTokenSignature } from "@/app/api/send-otp/route";
import {
  signCustomerPayload,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customerSession";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function normalizeIranPhone(raw: any): string {
  const digits = String(raw || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

function hashCustomerPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password.trim(), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateCheck = await rateLimiter.checkLimit(
      clientIp,
      "auth_recovery_action",
      15,
      10
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً دقایقی دیگر تلاش کنید.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "check_customer_phone") {
      const cleanPhone = normalizeIranPhone(body.phone);
      if (!/^09\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, message: "شماره همراه نامعتبر است." },
          { status: 400 }
        );
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

    // بازنشانی امن کلمه عبور مشتری پس از تایید OTP
    if (action === "reset_customer_password") {
      const cleanPhone = normalizeIranPhone(body.phone);
      const newPassword = String(body.newPassword || "").trim();
      const otpToken = String(body.otpVerificationToken || "").trim();
      const cookieToken =
        req.cookies.get("axon_verified_phone_token")?.value || "";

      if (!/^09\d{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, message: "شماره همراه نامعتبر است." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message: "کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.",
          },
          { status: 400 }
        );
      }

      const isVerified =
        verifyPhoneTokenSignature(cleanPhone, otpToken) ||
        verifyPhoneTokenSignature(cleanPhone, cookieToken);

      if (!isVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "تایید پیامکی شماره همراه منقضی یا نامعتبر است.",
          },
          { status: 403 }
        );
      }

      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("id, phone, username, email")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (!customer) {
        return NextResponse.json(
          { success: false, message: "حساب کاربری با این شماره یافت نشد." },
          { status: 404 }
        );
      }

      const newHash = hashCustomerPassword(newPassword);
      const { error: updErr } = await supabaseAdmin
        .from("customers")
        .update({ password_hash: newHash })
        .eq("id", customer.id);

      if (updErr) throw updErr;

      const userObj = {
        id: String(customer.id),
        phone: customer.phone,
        username: customer.username || customer.phone,
        email: customer.email || undefined,
        name: customer.username || customer.phone,
      };
      const sessionToken = await signCustomerPayload(userObj);

      const res = NextResponse.json({
        success: true,
        user: userObj,
        message: "✓ کلمه عبور جدید با موفقیت ثبت شد.",
      });
      res.cookies.set(CUSTOMER_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      return res;
    }

    if (action === "admin_forgot") {
      const cleanEmail = String(body.email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json(
          { success: false, message: "ایمیل معتبر الزامی است." },
          { status: 400 }
        );
      }

      const generatedPin = crypto.randomInt(100000, 999999).toString();
      const pinHash = crypto
        .createHash("sha256")
        .update(generatedPin)
        .digest("hex");
      const expiresAt = Date.now() + 5 * 60 * 1000;

      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const sys = normalizeSystemSettings(layoutCfg, siteRow);
      const storeName = sys.site_name || "فروشگاه";
      const currentAuthCfg = layoutCfg.auth_security_config || {};

      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          auth_security_config: {
            ...currentAuthCfg,
            admin_recovery: {
              email: cleanEmail,
              pinHash,
              expiresAt,
              requestedAt: new Date().toISOString(),
            },
          },
        },
        {}
      );

      const adminPhone = normalizeIranPhone(
        sys.mobile_support || sys.phone || ""
      );
      if (/^09\d{9}$/.test(adminPhone)) {
        try {
          await smsService.sendSMS(
            adminPhone,
            `کد امنیتی بازیابی پنل مدیریت ${storeName}: ${generatedPin} (اعتبار: ۵ دقیقه)`
          );
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message:
          "کد تایید بازیابی به شماره پشتیبانی ثبت‌شده مدیر ارسال گردید.",
      });
    }

    return NextResponse.json(
      { success: false, message: "درخواست نامعتبر است." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err && err.message ? err.message : "خطای سرور",
      },
      { status: 500 }
    );
  }
}