// File Path: app/api/user/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { signCustomerPayload, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";

export const dynamic = "force-dynamic";

function hashCustomerPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.trim(), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyCustomerPassword(supplied: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) return false;
  try {
    const [salt, key] = stored.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derived = scryptSync(supplied.trim(), salt, 32);
    return timingSafeEqual(keyBuffer, derived);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, username, password, identifier, email } = body;

    if (action === "oauth_sync") {
      return NextResponse.json(
        { success: false, message: "ثبت مستقیم OAuth بدون تاییدیه توکن رسمی مسدود است." },
        { status: 403 }
      );
    }

    if (action === "register") {
      const cleanPhone = String(phone || "")
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");
      const cleanPass = String(password || "").trim();

      if (cleanPhone.length !== 11 || !cleanPass) {
        return NextResponse.json({ success: false, message: "شماره همراه ۱۱ رقمی و کلمه عبور الزامی است." }, { status: 400 });
      }

      const { data: existing } = await supabaseAdmin.from("customers").select("id").eq("phone", cleanPhone).maybeSingle();
      if (existing) {
        return NextResponse.json({ success: false, message: "این شماره قبلاً در سامانه ثبت‌نام شده است." }, { status: 400 });
      }

      const newCustomer = {
        phone: cleanPhone,
        username: username ? String(username).trim() : cleanPhone,
        email: email ? String(email).trim().toLowerCase() : null,
        password_hash: hashCustomerPassword(cleanPass),
        created_at: new Date().toISOString(),
      };

      const { data: created, error } = await supabaseAdmin.from("customers").insert([newCustomer]).select().single();
      if (error) throw error;

      const userObj = {
        id: String(created.id),
        phone: created.phone,
        username: created.username,
        email: created.email || undefined,
        name: created.username,
      };

      const token = signCustomerPayload(userObj);
      const res = NextResponse.json({ success: true, message: "ثبت‌نام با موفقیت انجام شد.", user: userObj });
      
      res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return res;
    }

    if (action === "login_credentials") {
      const cleanId = String(identifier || "").trim().toLowerCase();
      const cleanPass = String(password || "").trim();

      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .or(`phone.eq.${cleanId},username.eq.${cleanId},email.eq.${cleanId}`)
        .maybeSingle();

      if (!customer || !verifyCustomerPassword(cleanPass, customer.password_hash || "")) {
        return NextResponse.json({ success: false, message: "نام کاربری یا کلمه عبور نادرست است." }, { status: 401 });
      }

      const userObj = {
        id: String(customer.id),
        phone: customer.phone,
        username: customer.username,
        email: customer.email || undefined,
        name: customer.username || customer.phone,
      };

      const token = signCustomerPayload(userObj);
      const res = NextResponse.json({ success: true, message: "ورود با موفقیت انجام شد.", user: userObj });
      
      res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return res;
    }

    return NextResponse.json({ success: false, message: "نوع عملیات نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
