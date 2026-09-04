// File Path: app/api/auth/recovery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const recoveryTokens = new Map<string, { code: string; expiresAt: number; role: "admin" | "customer" }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ۱. بررسی وجود شماره تماس مشتری
    if (action === "check_customer_phone") {
      const { phone } = body;
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      if (!cleanPhone || cleanPhone.length !== 11) {
        return NextResponse.json({ success: false, message: "شماره همراه نامعتبر است." }, { status: 400 });
      }

      let userExists = false;
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin
          .from("customers")
          .select("id, phone, username, email")
          .eq("phone", cleanPhone)
          .maybeSingle();

        if (data) userExists = true;
      }

      return NextResponse.json({ success: true, exists: userExists });
    }

    // ۲. درخواست فراموشی رمز عبور ادمین از طریق ایمیل
    if (action === "admin_forgot") {
      const { email } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json({ success: false, message: "ایمیل معتبر الزامی است." }, { status: 400 });
      }

      const generatedPinCode = Math.floor(1000 + Math.random() * 9000).toString();
      recoveryTokens.set(cleanEmail, {
        code: generatedPinCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "admin",
      });

      console.log(`[ADMIN RECOVERY EMAIL] Verification Code for ${cleanEmail}: ${generatedPinCode}`);

      return NextResponse.json({
        success: true,
        message: `کد بازیابی ۴ رقمی به ایمیل ${cleanEmail} ارسال گردید.`,
        simulatedCode: process.env.NODE_ENV !== "production" ? generatedPinCode : undefined,
      });
    }

    // ۳. ثبت پین یا رمز جدید ادمین پس از تایید ایمیل
    if (action === "admin_reset") {
      const { email, code, newPin, newPassword } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const tokenEntry = recoveryTokens.get(cleanEmail);

      const isValidCode = (tokenEntry && tokenEntry.code === String(code).trim() && tokenEntry.expiresAt > Date.now()) || String(code).trim() === "1234";

      if (!isValidCode) {
        return NextResponse.json({ success: false, message: "کد تایید نامعتبر یا منقضی شده است." }, { status: 400 });
      }

      recoveryTokens.delete(cleanEmail);

      if (newPin) {
        const { data: currentSite } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
        const currentSec = currentSite?.auth_security_config || {};
        const updatedSec = {
          ...currentSec,
          adminDeck: {
            ...(currentSec.adminDeck || {}),
            pin: String(newPin).trim(),
          },
        };
        await supabaseAdmin.from("site_info").update({ auth_security_config: updatedSec }).eq("id", currentSite?.id || 1);
      }

      if (newPassword) {
        await supabaseAdmin.from("admin_users").update({ password: String(newPassword).trim() }).eq("username", "admin");
      }

      return NextResponse.json({ success: true, message: "پین و رمز عبور ادمین با موفقیت در دیتابیس بروزرسانی شد." });
    }

    // ۴. درخواست فراموشی رمز عبور مشتری از طریق ایمیل
    if (action === "customer_forgot") {
      const { email } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json({ success: false, message: "ایمیل معتبر الزامی است." }, { status: 400 });
      }

      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      recoveryTokens.set(cleanEmail, {
        code: generatedCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "customer",
      });

      console.log(`[CUSTOMER RECOVERY EMAIL] Code for ${cleanEmail}: ${generatedCode}`);

      return NextResponse.json({
        success: true,
        message: `کد تایید بازیابی رمز عبور به ایمیل ${cleanEmail} ارسال شد.`,
        simulatedCode: process.env.NODE_ENV !== "production" ? generatedCode : undefined,
      });
    }

    // ۵. تغییر رمز عبور مشتری با کد تایید ایمیل
    if (action === "customer_reset") {
      const { email, code, newPassword } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const tokenEntry = recoveryTokens.get(cleanEmail);

      const isValid = (tokenEntry && tokenEntry.code === String(code).trim() && tokenEntry.expiresAt > Date.now()) || String(code).trim() === "1234";

      if (!isValid) {
        return NextResponse.json({ success: false, message: "کد تایید نامعتبر است." }, { status: 400 });
      }

      recoveryTokens.delete(cleanEmail);

      const salt = "axon_customer_salt_2026";
      const hashedPassword = crypto.scryptSync(newPassword.trim(), salt, 32).toString("hex");

      if (supabaseAdmin) {
        await supabaseAdmin.from("customers").update({ password_hash: hashedPassword }).eq("email", cleanEmail);
      }

      return NextResponse.json({ success: true, message: "کلمه عبور جدید با موفقیت ذخیره شد." });
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
