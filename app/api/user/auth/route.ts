import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

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
    const { action, phone, username, password, identifier } = body;

    // حذف کامل و مسدودسازی جعل oauth_sync
    if (action === "oauth_sync") {
      return NextResponse.json(
        { success: false, message: "ثبت مستقیم OAuth بدون تاییدیه توکن رسمی گوگل/اپل مسدود است." },
        { status: 403 }
      );
    }

    if (action === "register") {
      const cleanPhone = String(phone || "").trim().replace(/\D/g, "");
      const cleanPass = String(password || "").trim();

      if (cleanPhone.length !== 11 || !cleanPass) {
        return NextResponse.json({ success: false, message: "شماره همراه ۱۱ رقمی و کلمه عبور الزامی است." }, { status: 400 });
      }

      const { data: existing } = await supabaseAdmin.from("customers").select("id").eq("phone", cleanPhone).maybeSingle();
      if (existing) {
        return NextResponse.json({ success: false, message: "این شماره قبلاً ثبت‌نام کرده است." }, { status: 400 });
      }

      const newCustomer = {
        phone: cleanPhone,
        username: username ? String(username).trim() : cleanPhone,
        password_hash: hashCustomerPassword(cleanPass),
        created_at: new Date().toISOString(),
      };

      const { data: created, error } = await supabaseAdmin.from("customers").insert([newCustomer]).select().single();
      if (error) throw error;

      return NextResponse.json({ success: true, user: { id: created.id, phone: created.phone, username: created.username } });
    }

    if (action === "login_credentials") {
      const cleanId = String(identifier || "").trim();
      const cleanPass = String(password || "").trim();

      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .or(`phone.eq.${cleanId},username.eq.${cleanId}`)
        .maybeSingle();

      if (!customer || !verifyCustomerPassword(cleanPass, customer.password_hash || "")) {
        return NextResponse.json({ success: false, message: "اطلاعات ورود نامعتبر است." }, { status: 401 });
      }

      return NextResponse.json({ success: true, user: { id: customer.id, phone: customer.phone, username: customer.username } });
    }

    return NextResponse.json({ success: false, message: "اکشن نامعتبر است." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
