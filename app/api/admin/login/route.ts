import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hooaobrxgwakqqibcfdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_secure_production_fallback_2026_key";

function verifyPassword(inputPass: string, storedPass: string): boolean {
  if (!inputPass || !storedPass) return false;
  const cleanInput = inputPass.trim();
  const cleanStored = storedPass.trim();

  // تطابق مستقیم با رکورد ثبت‌شده در دیتابیس
  if (cleanInput === cleanStored) return true;

  // بررسی در صورتی که با SHA-256 هش شده باشد
  const sha = crypto.createHash("sha256").update(cleanInput).digest("hex");
  if (cleanStored === sha) return true;

  // بررسی در صورتی که با scrypt هش شده باشد
  if (cleanStored.includes(":")) {
    const [salt, hash] = cleanStored.split(":");
    if (salt && hash) {
      try {
        const computed = crypto.scryptSync(cleanInput, salt, 64).toString("hex");
        if (crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"))) {
          return true;
        }
      } catch {}
    }
  }

  return false;
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

    // استعلام مستقیم رکورد کاربر مدیر از جدول admin_users
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." },
        { status: 401 }
      );
    }

    const targetPassword = String(user.password || user.pin || user.pin_hash || "");
    const isValid = verifyPassword(password, targetPassword);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." },
        { status: 401 }
      );
    }

    // ایجاد توکن سشن امن HMAC با انقضای ۷ روزه
    const expTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = `${username}:${expTime}`;
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const sessionToken = `${payload}:${signature}`;

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      user: {
        username: user.username,
        role: user.role || "superadmin",
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
      { success: false, message: err?.message || "خطای سرور در اعتبارسنجی." },
      { status: 500 }
    );
  }
}
