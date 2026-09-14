import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_core_fixed_session_secret_2026";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || body.pin || "").trim();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "نام کاربری و کلمه عبور الزامی است." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "ارتباط با دیتابیس برقرار نیست." }, { status: 500 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." }, { status: 401 });
    }

    const storedPass = String(user.password || user.pin || user.pin_hash || "").trim();
    let isMatch = (password === storedPass);

    if (!isMatch && storedPass.includes(":")) {
      const [salt, hash] = storedPass.split(":");
      try {
        const computed = crypto.scryptSync(password, salt, 64).toString("hex");
        isMatch = crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
      } catch {}
    }

    if (!isMatch) {
      const sha = crypto.createHash("sha256").update(password).digest("hex");
      isMatch = (storedPass === sha);
    }

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "شناسه کاربری یا کلمه عبور نادرست است." }, { status: 401 });
    }

    // تولید امضای امنیتی سشن
    const expTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = `${username}:${expTime}`;
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const sessionToken = `${payload}:${signature}`;

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      redirectTo: "/admin/dashboard",
      message: "ورود موفقیت‌آمیز بود.",
      user: { username: user.username, role: user.role || "superadmin" },
    });

    // ست کردن کوکی استاندارد و کوکی بدون HttpOnly برای هماهنگی فرانت و سرور
    response.cookies.set("admin_session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("admin_logged_in", "true", {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
