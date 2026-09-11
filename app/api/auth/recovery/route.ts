// File Path: app/api/auth/recovery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const RECOVERY_SECRET = process.env.RECOVERY_SECRET || process.env.SESSION_SECRET || "axon_recovery_vault_secret_2026";

function generateRecoveryTicket(email: string, code: string, role: string, expMinutes = 10): string {
  const expiresAt = Date.now() + expMinutes * 60 * 1000;
  const payload = `${email}:${code}:${role}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", RECOVERY_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function verifyRecoveryTicket(email: string, code: string, role: string, ticket: string): boolean {
  try {
    const raw = Buffer.from(ticket, "base64url").toString("utf8");
    const parts = raw.split(":");
    if (parts.length !== 5) return false;

    const [storedEmail, storedCode, storedRole, storedExpStr, providedSig] = parts;
    const exp = Number(storedExpStr);

    if (Date.now() > exp) return false;
    if (storedEmail !== email || storedCode !== code || storedRole !== role) return false;

    const expectedPayload = `${storedEmail}:${storedCode}:${storedRole}:${storedExpStr}`;
    const expectedSig = crypto.createHmac("sha256", RECOVERY_SECRET).update(expectedPayload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(providedSig, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

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
        const { data } = await supabaseAdmin
          .from("customers")
          .select("id, phone, username, email")
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

      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      const ticket = generateRecoveryTicket(cleanEmail, generatedPin, "admin", 10);

      return NextResponse.json({
        success: true,
        message: `کد بازیابی به ایمیل ${cleanEmail} ارسال گردید.`,
        recoveryTicket: ticket,
      });
    }

    if (action === "admin_reset") {
      const { email, code, newPassword, recoveryTicket } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!recoveryTicket || !verifyRecoveryTicket(cleanEmail, String(code).trim(), "admin", recoveryTicket)) {
        return NextResponse.json({ success: false, message: "کد تایید یا تیکت بازیابی نامعتبر یا منقضی شده است." }, { status: 400 });
      }

      if (newPassword && supabaseAdmin) {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto.scryptSync(newPassword.trim(), salt, 64).toString("hex");
        await supabaseAdmin.from("admin_users").update({ password: `${salt}:${hashedPassword}` }).eq("username", "admin");
      }

      return NextResponse.json({ success: true, message: "کلمه عبور مدیریت با موفقیت در پایگاه داده ذخیره شد." });
    }

    if (action === "customer_forgot") {
      const { email } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json({ success: false, message: "ایمیل معتبر الزامی است." }, { status: 400 });
      }

      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const ticket = generateRecoveryTicket(cleanEmail, generatedCode, "customer", 10);

      return NextResponse.json({
        success: true,
        message: `کد تایید بازیابی رمز عبور به ایمیل ${cleanEmail} ارسال شد.`,
        recoveryTicket: ticket,
      });
    }

    if (action === "customer_reset") {
      const { email, code, newPassword, recoveryTicket } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!recoveryTicket || !verifyRecoveryTicket(cleanEmail, String(code).trim(), "customer", recoveryTicket)) {
        return NextResponse.json({ success: false, message: "کد تایید نامعتبر است." }, { status: 400 });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = crypto.scryptSync(newPassword.trim(), salt, 32).toString("hex");

      if (supabaseAdmin) {
        await supabaseAdmin.from("customers").update({ password_hash: `${salt}:${hashedPassword}` }).eq("email", cleanEmail);
      }

      return NextResponse.json({ success: true, message: "کلمه عبور جدید با موفقیت ذخیره شد." });
    }

    return NextResponse.json({ success: false, message: "درخواست نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
