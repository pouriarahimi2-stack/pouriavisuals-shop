import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { signPayload, COOKIE_NAME } from "@/lib/session";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, password, full_name, role } = body;

    // ۱. قابلیت ثبت‌نام مستقیم مدیر / پرسنل جدید با هش امنیتی
    if (action === "register") {
      const cleanUser = String(username || "").trim().toLowerCase();
      const cleanPass = String(password || "").trim();

      if (!cleanUser || cleanPass.length < 4) {
        return NextResponse.json({ success: false, message: "نام کاربری و کلمه عبور حداقل ۴ کاراکتر الزامی است." }, { status: 400 });
      }

      const hashedPassword = authSecurity.hashPassword(cleanPass);
      const newAdmin = {
        username: cleanUser,
        password_hash: hashedPassword,
        full_name: full_name?.trim() || cleanUser,
        role: role || "superadmin",
        created_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from("admin_users").insert([newAdmin]);
        if (error) {
          return NextResponse.json({ success: false, message: "این نام کاربری از قبل وجود دارد." }, { status: 400 });
        }
      }

      return NextResponse.json({ success: true, message: "حساب کاربری مدیر با موفقیت ایجاد گردید. اکنون می‌توانید وارد شوید." });
    }

    // ۲. ورود به سیستم فقط از طریق اعتبارسنجی در دیتابیس (بدون هیچ هاردکدی)
    const cleanUsername = String(username || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json({ success: false, message: "نام کاربری و کلمه عبور را وارد نمایید." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "ارتباط با پایگاه داده برقرار نیست." }, { status: 500 });
    }

    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "کاربری با این مشخصات یافت نشد. در صورت تمایل ابتدا ثبت‌نام کنید." }, { status: 401 });
    }

    const storedHash = adminUser.password_hash || adminUser.password;
    const isValid = authSecurity.verifyPassword(cleanPassword, storedHash) || storedHash === cleanPassword;

    if (!isValid) {
      return NextResponse.json({ success: false, message: "کلمه عبور وارد شده نادرست است." }, { status: 401 });
    }

    const token = await signPayload({
      id: String(adminUser.id),
      username: adminUser.username,
      full_name: adminUser.full_name || adminUser.username,
      role: adminUser.role || "superadmin",
    });

    const res = NextResponse.json({
      success: true,
      message: "ورود تایید شد.",
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role || "superadmin",
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    res.cookies.set("admin_logged_in", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطای سرور در احراز هویت." }, { status: 500 });
  }
}
