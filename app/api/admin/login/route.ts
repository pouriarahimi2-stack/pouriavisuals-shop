import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_secure_production_fallback_2026_key";

function verifyPasswordAgainstHash(inputPass: string, storedPass: string): boolean {
  if (!storedPass || !inputPass) return false;

  // ۱. بررسی فرمت scrypt (salt:hash)
  if (storedPass.includes(":")) {
    const parts = storedPass.split(":");
    if (parts.length === 2) {
      const [salt, hash] = parts;
      try {
        const computed = crypto.scryptSync(inputPass, salt, 64).toString("hex");
        return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
      } catch {
        return false;
      }
    }
  }

  // ۲. بررسی هش SHA256
  const sha = crypto.createHash("sha256").update(inputPass).digest("hex");
  if (storedPass === sha) return true;

  // ۳. بررسی مقدار متنی ذخیره‌شده فعلی در دیتابیس
  return crypto.timingSafeEqual(Buffer.from(inputPass), Buffer.from(storedPass));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || body.pin || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربری و کلمه عبور الزامی است." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "ارتباط با پایگاه داده برقرار نیست." },
        { status: 500 }
      );
    }

    // استعلام مستقیم از جدول admin_users - هیچ کاربری بدون وجود در دیتابیس اجازه ورود ندارد
    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, username, password, pin, pin_hash, role, full_name")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." },
        { status: 401 }
      );
    }

    const targetStoredSecret = String(user.password || user.pin || user.pin_hash || "");
    const isPasswordValid = verifyPasswordAgainstHash(password, targetStoredSecret);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." },
        { status: 401 }
      );
    }

    // تولید توکن امن رمزنگاری‌شده با HMAC-SHA256 و تاریخ انقضا (۷ روز)
    const expTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = `${user.username}:${expTime}`;
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const sessionToken = `${payload}:${signature}`;

    const response = NextResponse.json({
      success: true,
      message: "ورود موفقیت‌آمیز بود.",
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });

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
      { success: false, message: "خطای سرور در اعتبارسنجی هویت." },
      { status: 500 }
    );
  }
}
