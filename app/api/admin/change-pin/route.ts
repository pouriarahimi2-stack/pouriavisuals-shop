// File Path: app/api/admin/change-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = String(body.currentPin || body.currentPassword || "").trim();
    const newPassword = String(body.newPin || body.newPassword || "").trim();
    const targetUsername = body.targetUsername
      ? String(body.targetUsername).trim().toLowerCase()
      : String(session.username || "").trim().toLowerCase();

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: "رمز عبور / پین جدید باید حداقل ۴ کاراکتر باشد." },
        { status: 400 }
      );
    }

    if (targetUsername && targetUsername !== String(session.username || "").toLowerCase()) {
      if (session.role !== "superadmin") {
        return NextResponse.json(
          { success: false, message: "تغییر رمز سایر مدیران فقط برای مدیر ارشد مجاز است." },
          { status: 403 }
        );
      }
    }

    const hashedNewPassword = authSecurity.hashPassword(newPassword);

    let userRecord: any = null;
    if (targetUsername) {
      const { data } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("username", targetUsername)
        .maybeSingle();
      userRecord = data;
    }

    if (!userRecord && session.id) {
      const { data } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("id", session.id)
        .maybeSingle();
      userRecord = data;
    }

    if (
      userRecord &&
      currentPassword &&
      targetUsername === String(session.username || "").toLowerCase() &&
      (userRecord.password_hash || userRecord.password)
    ) {
      const storedHash = userRecord.password_hash || userRecord.password;
      const isMatch =
        authSecurity.verifyPassword(currentPassword, storedHash) ||
        currentPassword === storedHash;
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "رمز عبور فعلی وارد شده صحیح نیست." },
          { status: 400 }
        );
      }
    }

    if (userRecord && userRecord.id) {
      const { error: updateErr } = await supabaseAdmin
        .from("admin_users")
        .update({
          password: hashedNewPassword,
          password_hash: hashedNewPassword,
        })
        .eq("id", userRecord.id);

      if (updateErr) throw updateErr;
    } else if (targetUsername) {
      await supabaseAdmin.from("admin_users").insert([
        {
          username: targetUsername,
          password: hashedNewPassword,
          password_hash: hashedNewPassword,
          full_name: session.full_name || targetUsername,
          role: session.role || "superadmin",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    try {
      await supabaseAdmin.from("admin_audit_logs").insert([
        {
          action: "CHANGE_ADMIN_PASSWORD",
          user_id: session.username || "admin",
          details: { role: session.role, target: targetUsername },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message:
        "✓ کلمه عبور جدید برای حساب «" +
        (targetUsername || session.username || "مدیر") +
        "» با موفقیت جایگزین رمز قبلی و در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تغییر رمز عبور." },
      { status: 500 }
    );
  }
}
