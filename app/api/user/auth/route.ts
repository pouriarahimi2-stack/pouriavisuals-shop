import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
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
    const keyBuf  = Buffer.from(key, "hex");
    const derived = scryptSync(supplied.trim(), salt, 32);
    return timingSafeEqual(keyBuf, derived);
  } catch { return false; }
}

function cleanPhone(raw: string): string {
  return String(raw || "").trim()
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
}

function setCookie(res: NextResponse, token: string): void {
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   30 * 24 * 60 * 60,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, username, password, identifier, email } = body;

    if (action === "oauth_sync") {
      return NextResponse.json({ success: false, message: "OAuth بدون توکن رسمی مسدود است." }, { status: 403 });
    }

    // ── ثبت‌نام ──────────────────────────────────
    if (action === "register") {
      const cp = cleanPhone(String(phone || ""));
      const pw = String(password || "").trim();
      if (cp.length !== 11 || !cp.startsWith("09") || !pw) {
        return NextResponse.json({ success: false, message: "شماره همراه ۱۱ رقمی و کلمه عبور الزامی است." }, { status: 400 });
      }
      const { data: ex } = await supabaseAdmin.from("customers").select("id").eq("phone", cp).maybeSingle();
      if (ex) return NextResponse.json({ success: false, message: "این شماره قبلاً ثبت شده است." }, { status: 400 });

      // insert بدون created_at — ممکنه جدول نداشته باشد
      const newCustomer: Record<string, unknown> = {
        phone:         cp,
        username:      username ? String(username).trim() : cp,
        email:         email ? String(email).trim().toLowerCase() : null,
        password_hash: hashPwd(pw),
      };

      const { data: created, error } = await supabaseAdmin.from("customers").insert([newCustomer]).select().single();
      if (error) {
        // اگر ستون دیگری مشکل داشت، بدون email هم امتحان کن
        if (String(error.message).includes("column")) {
          const minimal: Record<string, unknown> = { phone: cp, username: String(username || cp).trim(), password_hash: hashPwd(pw) };
          const { data: c2, error: e2 } = await supabaseAdmin.from("customers").insert([minimal]).select().single();
          if (e2) throw e2;
          const u = { id: String(c2.id), phone: c2.phone, username: c2.username, name: c2.username || c2.phone };
          const token = await signCustomerPayload(u);
          const r = NextResponse.json({ success: true, message: "ثبت‌نام انجام شد.", user: u });
          setCookie(r, token);
          return r;
        }
        throw error;
      }

      const userObj = { id: String(created.id), phone: created.phone, username: created.username, email: created.email || undefined, name: created.username || created.phone };
      const token   = await signCustomerPayload(userObj);
      const r       = NextResponse.json({ success: true, message: "ثبت‌نام با موفقیت انجام شد.", user: userObj });
      setCookie(r, token);
      return r;
    }

    // ── ورود با رمز ──────────────────────────────
    if (action === "login_credentials") {
      const id = String(identifier || "").trim().toLowerCase();
      const pw = String(password || "").trim();
      if (!id || !pw) return NextResponse.json({ success: false, message: "مشخصات ورود ناقص است." }, { status: 400 });

      const { data: customer } = await supabaseAdmin.from("customers").select("*")
        .or(`phone.eq.${id},username.eq.${id},email.eq.${id}`).maybeSingle();

      if (!customer || !verifyPwd(pw, customer.password_hash || "")) {
        return NextResponse.json({ success: false, message: "نام کاربری یا کلمه عبور نادرست است." }, { status: 401 });
      }

      const userObj = { id: String(customer.id), phone: customer.phone, username: customer.username, email: customer.email || undefined, name: customer.username || customer.phone };
      const token   = await signCustomerPayload(userObj);
      const r       = NextResponse.json({ success: true, message: "ورود موفق.", user: userObj });
      setCookie(r, token);
      return r;
    }

    // ── بررسی session ─────────────────────────────
    if (action === "check") {
      const cookieVal = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
      if (!cookieVal) return NextResponse.json({ success: false, message: "لاگین نشده." });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر." }, { status: 400 });
  } catch (err: any) {
    console.error("[user/auth]", err);
    // خطای schema cache — ستون وجود ندارد
    if (String(err.message).includes("schema cache") || String(err.message).includes("column")) {
      return NextResponse.json({ success: false, message: "خطای ساختار جدول: " + err.message }, { status: 500 });
    }
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
