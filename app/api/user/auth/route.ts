// File Path: app/api/user/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import {
  signCustomerPayload,
  verifyCustomerPayload,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customerSession";
import { rateLimiter } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

function hashPwd(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.trim(), salt, 32).toString("hex");
  return salt + ":" + hash;
}

function verifyPwd(supplied: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) return false;
  try {
    const [salt, key] = stored.split(":");
    const keyBuf = Buffer.from(key, "hex");
    const derived = scryptSync(supplied.trim(), salt, 32);
    return timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}

function cleanPhone(raw: string): string {
  const digits = String(raw || "")
    .trim()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

function setCookie(res: NextResponse, token: string): void {
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json();
    const { action, phone, username, password, identifier, email } = body;

    if (action === "register") {
      const regRate = await rateLimiter.checkLimit(
        clientIp,
        "customer_register",
        6,
        15
      );
      if (!regRate.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: "تعداد تلاش‌های ثبت‌نام بیش از حد مجاز است. لطفاً دقایقی دیگر تلاش کنید.",
          },
          { status: 429 }
        );
      }

      const cp = cleanPhone(String(phone || ""));
      const pw = String(password || "").trim();
      if (cp.length !== 11 || !cp.startsWith("09") || pw.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message: "شماره همراه ۱۱ رقمی و کلمه عبور حداقل ۶ کاراکتری الزامی است.",
          },
          { status: 400 }
        );
      }

      const { data: ex } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("phone", cp)
        .maybeSingle();

      if (ex) {
        return NextResponse.json(
          {
            success: false,
            message:
              "این شماره قبلاً ثبت شده است. لطفاً از تب رمز عبور وارد شوید.",
          },
          { status: 400 }
        );
      }

      const cleanUser = username
        ? String(username).replace(/[<>"']/g, "").trim()
        : cp;

      if (cleanUser !== cp) {
        const { data: exUsername } = await supabaseAdmin
          .from("customers")
          .select("id")
          .ilike("username", cleanUser)
          .maybeSingle();

        if (exUsername) {
          return NextResponse.json(
            {
              success: false,
              message: "این نام کاربری قبلاً انتخاب شده است. لطفاً نام دیگری وارد کنید.",
            },
            { status: 400 }
          );
        }
      }

      const generatedId = randomUUID();
      const pwdHash = hashPwd(pw);

      const newCustomer: Record<string, any> = {
        id: generatedId,
        phone: cp,
        username: cleanUser,
        email: email ? String(email).trim().toLowerCase() : null,
        password_hash: pwdHash,
      };

      let createdRecord: any = null;
      const { data: c1, error: e1 } = await supabaseAdmin
        .from("customers")
        .insert([newCustomer])
        .select()
        .maybeSingle();

      if (!e1 && c1) {
        createdRecord = c1;
      } else {
        const minimal: Record<string, any> = {
          id: generatedId,
          phone: cp,
          username: cleanUser,
          password_hash: pwdHash,
        };
        const { data: c2, error: e2 } = await supabaseAdmin
          .from("customers")
          .insert([minimal])
          .select()
          .maybeSingle();

        if (!e2 && c2) {
          createdRecord = c2;
        } else {
          createdRecord = { id: generatedId, phone: cp, username: cleanUser };
        }
      }

      try {
        await supabaseAdmin.from("crm_customers").upsert([
          {
            id: "cust_" + cp,
            full_name: cleanUser,
            phone: cp,
            lifecycle_stage: "lead",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch {}

      const userObj = {
        id: String(createdRecord.id || generatedId),
        phone: cp,
        username: cleanUser,
        email: email ? String(email).trim().toLowerCase() : undefined,
        name: cleanUser,
      };
      const token = await signCustomerPayload(userObj);
      const r = NextResponse.json({
        success: true,
        message: "ثبت‌نام با موفقیت انجام شد.",
        user: userObj,
      });
      setCookie(r, token);
      return r;
    }

    if (action === "login_credentials") {
      const loginRate = await rateLimiter.checkLimit(
        clientIp,
        "customer_password_login",
        12,
        15
      );
      if (!loginRate.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.",
          },
          { status: 429 }
        );
      }

      const id = String(identifier || "").trim();
      const cleanIdPhone = cleanPhone(id);
      const pw = String(password || "").trim();
      if (!id || !pw) {
        return NextResponse.json(
          { success: false, message: "مشخصات ورود ناقص است." },
          { status: 400 }
        );
      }

      // جستجوی ایمن و پارامتری بدون تزریق رشته در فیلتر OR
      let customer: any = null;
      if (/^09\d{9}$/.test(cleanIdPhone)) {
        const { data } = await supabaseAdmin
          .from("customers")
          .select("*")
          .eq("phone", cleanIdPhone)
          .maybeSingle();
        customer = data;
      }

      if (!customer && id.includes("@")) {
        const { data } = await supabaseAdmin
          .from("customers")
          .select("*")
          .eq("email", id.toLowerCase())
          .maybeSingle();
        customer = data;
      }

      if (!customer) {
        const { data } = await supabaseAdmin
          .from("customers")
          .select("*")
          .ilike("username", id)
          .limit(1)
          .maybeSingle();
        customer = data;
      }

      if (!customer || !verifyPwd(pw, customer.password_hash || "")) {
        return NextResponse.json(
          { success: false, message: "نام کاربری یا کلمه عبور نادرست است." },
          { status: 401 }
        );
      }

      const userObj = {
        id: String(customer.id),
        phone: customer.phone,
        username: customer.username,
        email: customer.email || undefined,
        name: customer.username || customer.phone,
      };
      const token = await signCustomerPayload(userObj);
      const r = NextResponse.json({
        success: true,
        message: "ورود موفق.",
        user: userObj,
      });
      setCookie(r, token);
      return r;
    }

    if (action === "check") {
      const cookieVal = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
      const verified = await verifyCustomerPayload(cookieVal);
      if (!verified) {
        return NextResponse.json({ success: false, message: "لاگین نشده." });
      }
      return NextResponse.json({ success: true, user: verified });
    }

    return NextResponse.json(
      { success: false, message: "عملیات نامعتبر." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieVal = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const verified = await verifyCustomerPayload(cookieVal);
    if (!verified) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
      });
    }
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: verified.id,
        phone: verified.phone,
        username: verified.username,
        email: verified.email,
        name: verified.name || verified.username,
      },
    });
  } catch {
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
    });
  }
}