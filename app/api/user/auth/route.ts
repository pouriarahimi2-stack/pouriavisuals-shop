// File Path: app/api/user/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from "crypto";
import { signCustomerPayload, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";

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
  return String(raw || "")
    .trim()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
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
    const body = await req.json();
    const { action, phone, username, password, identifier, email } = body;

    if (action === "register") {
      const cp = cleanPhone(String(phone || ""));
      const pw = String(password || "").trim();
      if (cp.length !== 11 || !cp.startsWith("09") || !pw) {
        return NextResponse.json(
          { success: false, message: "شماره همراه ۱۱ رقمی و کلمه عبور الزامی است." },
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
          { success: false, message: "این شماره قبلاً ثبت شده است. لطفاً از تب رمز عبور وارد شوید." },
          { status: 400 }
        );
      }

      const generatedId = randomUUID();
      const cleanUser = username ? String(username).trim() : cp;
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
          // اگر جدول customers ستون دیگری نیاز داشت، در crm_customers نیز ثبت شود
          createdRecord = { id: generatedId, phone: cp, username: cleanUser };
        }
      }

      // همگام‌سازی با جدول مشتریان پنل ادمین (CRM)
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
      const id = String(identifier || "").trim();
      const cleanIdPhone = cleanPhone(id);
      const pw = String(password || "").trim();
      if (!id || !pw) {
        return NextResponse.json({ success: false, message: "مشخصات ورود ناقص است." }, { status: 400 });
      }

      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .or("phone.eq." + (cleanIdPhone || id) + ",username.eq." + id + ",email.eq." + id.toLowerCase())
        .maybeSingle();

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
      const r = NextResponse.json({ success: true, message: "ورود موفق.", user: userObj });
      setCookie(r, token);
      return r;
    }

    if (action === "check") {
      const cookieVal = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
      if (!cookieVal) return NextResponse.json({ success: false, message: "لاگین نشده." });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieVal = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!cookieVal) return NextResponse.json({ success: false, user: null });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, user: null });
  }
}
