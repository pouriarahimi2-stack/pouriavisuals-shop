import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_secure_production_fallback_2026_key";

function verifyPassword(inputPass: string, storedPass: string): boolean {
  if (!storedPass) return false;

  // ۱. بررسی فرمت scrypt (salt:hash)
  if (storedPass.includes(":")) {
    const parts = storedPass.split(":");
    if (parts.length === 2) {
      const [salt, storedHash] = parts;
      const computedHash = crypto.scryptSync(inputPass, salt, 64).toString("hex");
      try {
        if (crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(storedHash, "hex"))) {
          return true;
        }
      } catch {}
    }
  }

  // ۲. بررسی هش SHA256
  const sha256Hash = crypto.createHash("sha256").update(inputPass).digest("hex");
  if (storedPass === sha256Hash) return true;

  // ۳. بررسی متن خام (Plain text مانند 6110 موجود در دیتابیس)
  return inputPass === storedPass;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || body.pin || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و کلمه عبور الزامی است." },
        { status: 400 }
      );
    }

    // واکشی کاربر مدیر از دیتابیس Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "کاربری با این مشخصات یافت نشد." },
        { status: 401 }
      );
    }

    const storedPass = String(user.password || user.pin || user.pin_hash || "");
    const isValid = verifyPassword(password, storedPass);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "کلمه عبور یا پین‌کد وارد شده نادرست است." },
        { status: 401 }
      );
    }

    // تولید توکن امن مطابق با فرمت HMAC اعتبارسنجی شده در middleware.ts
    const expTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // ۷ روز اعتبار
    const payload = `${username}:${expTime}`;
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const sessionToken = `${payload}:${signature}`;

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });

    // ست کردن کوکی امنیتی
    response.cookies.set("admin_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور در احراز هویت." },
      { status: 500 }
    );
  }
}
