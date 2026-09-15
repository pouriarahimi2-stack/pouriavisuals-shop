import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload, COOKIE_NAME } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // محافظت در برابر حملات Brute-force
    const rateCheck = authSecurity.checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: `به دلیل تلاش‌های ناموفق مکرر، دسترسی شما برای ${rateCheck.waitMinutes || 15} دقیقه مسدود شد.`
      }, { status: 429 });
    }

    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || body.pin || "").trim();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "شناسه کاربری و کلمه عبور الزامی است." }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      authSecurity.recordFailedAttempt(clientIp);
      return NextResponse.json({ success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." }, { status: 401 });
    }

    const storedPass = String(user.password_hash || user.password || user.pin_hash || user.pin || "").trim();
    let isMatch = false;

    if (storedPass.includes(":")) {
      isMatch = authSecurity.verifyPassword(password, storedPass);
    } else {
      // سازگاری مهاجرت از رمزهای قدیمی به فرمت امن scrypt
      const sha = crypto.createHash("sha256").update(password).digest("hex");
      if (storedPass === password || storedPass === sha) {
        isMatch = true;
        // به‌روزرسانی خودکار رمز در دیتابیس به فرمت Salted Scrypt
        const newHashed = authSecurity.hashPassword(password);
        await supabaseAdmin.from("admin_users").update({
          password_hash: newHashed,
          password: null,
          pin_hash: null,
          pin: null,
          updated_at: new Date().toISOString()
        }).eq("id", user.id);
      }
    }

    if (!isMatch) {
      authSecurity.recordFailedAttempt(clientIp);
      return NextResponse.json({ success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." }, { status: 401 });
    }

    authSecurity.resetAttempts(clientIp);

    // صدور توکن امن با امضای دیجیتال
    const sessionToken = await signPayload({
      id: String(user.id),
      username: user.username,
      role: user.role || "superadmin",
      full_name: user.full_name || user.username,
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: "/admin/dashboard",
      message: "احراز هویت با موفقیت انجام شد.",
      user: { id: user.id, username: user.username, role: user.role || "superadmin", full_name: user.full_name },
    });

    // تنظیم کوکی امنیتی HttpOnly
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 72 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در احراز هویت." }, { status: 500 });
  }
}
