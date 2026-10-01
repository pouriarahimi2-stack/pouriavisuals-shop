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

    // اگر ادمین قصد تغییر رمز مدیر دیگری را دارد، حتماً باید superadmin باشد
    if (targetUsername && targetUsername !== String(session.username || "").toLowerCase()) {
      if (session.role !== "superadmin") {
        return NextResponse.json(
          { success: false, message: "تغییر رمز سایر مدیران فقط برای مدیر ارشد مجاز است." },
          { status: 403 }
        );
      }
    }

    const hashedNewPassword = authSecurity.hashPassword(newPassword);

    // بررسی وجود کاربر در جدول admin_users (برای همه نقش‌ها)
    let userRecord: any = null;
    if (session.id && (!body.targetUsername || targetUsername === String(session.username || "").toLowerCase())) {
      const { data } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("id", session.id)
        .maybeSingle();
      userRecord = data;
    }

    if (!userRecord && targetUsername) {
      const { data } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("username", targetUsername)
        .maybeSingle();
      userRecord = data;
    }

    // اگر خود کاربر رمز خودش را عوض می‌کند و رکورد در دیتابیس دارد، صحت رمز فعلی بررسی شود
    if (
      userRecord &&
      currentPassword &&
      session.role !== "superadmin" &&
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
      // اگر مدیر ارشد هنوز رکوردی در جدول admin_users نداشت، برایش ایجاد شود
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

    // اگر مدیر ارشد پین اصلی را تغییر داد، در site_info نیز همگام شود
    if (session.role === "superadmin" && (!body.targetUsername || targetUsername === String(session.username || "").toLowerCase())) {
      try {
        const { data: siteRow } = await supabaseAdmin
          .from("site_info")
          .select("id, auth_security_config")
          .limit(1)
          .maybeSingle();

        if (siteRow && siteRow.id) {
          await supabaseAdmin
            .from("site_info")
            .update({
              auth_security_config: {
                ...(siteRow.auth_security_config || {}),
                admin_pin_hash: hashedNewPassword,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", siteRow.id);
        }
      } catch {}
    }

    try {
      await supabaseAdmin.from("audit_logs").insert([
        {
          admin_username: session.username || "admin",
          action: "CHANGE_ADMIN_PASSWORD",
          target_resource: "admin_users:" + (targetUsername || session.id),
          details: { role: session.role, target: targetUsername },
          ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message:
        "✓ رمز عبور / پین امنیتی برای حساب «" +
        (targetUsername || session.username || "مدیر") +
        "» با موفقیت رمزنگاری و در دیتابیس بروزرسانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در تغییر رمز عبور." },
      { status: 500 }
    );
  }
}
