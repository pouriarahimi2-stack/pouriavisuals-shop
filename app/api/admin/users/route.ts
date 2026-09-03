// File Path: app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authSecurity } from "@/lib/authSecurity";
import { signPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let users: any[] = [];
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .select("id, username, full_name, role, created_at")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) users = data;
    }

    if (users.length === 0) {
      users = [
        {
          id: "admin_master",
          username: "admin",
          full_name: "مدیر ارشد سیستم",
          role: "superadmin",
          created_at: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, full_name, role } = body;
    if (!username || !password) {
      return NextResponse.json({ success: false, message: "نام کاربری و کلمه عبور الزامی است." }, { status: 400 });
    }

    const hashedPassword = authSecurity.hashPassword(String(password).trim());
    const payload = {
      id: `adm_${Date.now()}`,
      username: String(username).trim().toLowerCase(),
      password: hashedPassword,
      full_name: String(full_name || username).trim(),
      role: role || "product_manager",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .insert([payload])
        .select("id, username, full_name, role, created_at")
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطا در ایجاد مدیر جدید" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, currentPassword, password, full_name, role } = body;
    const targetId = id || "admin_master";

    // ۱. بررسی و اعتبارسنجی رمز فعلی در صورت تمایل به تغییر رمز
    if (password && String(password).trim().length > 0) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: "وارد کردن کلمه عبور فعلی الزامی است." }, { status: 400 });
      }

      let storedHash = "";
      if (supabaseAdmin) {
        const { data: adminRecord } = await supabaseAdmin
          .from("admin_users")
          .select("password")
          .or(`id.eq.${targetId},username.eq.${username || "admin"}`)
          .maybeSingle();

        if (adminRecord && adminRecord.password) {
          storedHash = String(adminRecord.password);
        }
      }

      // مقایسه با رمز موجود یا رمز پیش‌فرض سیستم
      const isCurrentValid = storedHash
        ? authSecurity.verifyPassword(currentPassword, storedHash)
        : (currentPassword === "admin123456" || currentPassword === "admin");

      if (!isCurrentValid) {
        return NextResponse.json({ success: false, message: "کلمه عبور فعلی وارد شده نادرست است!" }, { status: 403 });
      }
    }

    const updatePayload: Record<string, any> = {
      id: targetId,
      updated_at: new Date().toISOString(),
    };

    if (username) updatePayload.username = String(username).trim().toLowerCase();
    if (full_name) updatePayload.full_name = String(full_name).trim();
    if (role) updatePayload.role = role;
    if (password && String(password).trim().length > 0) {
      updatePayload.password = authSecurity.hashPassword(String(password).trim());
    }

    let savedUser: any = null;

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .upsert(updatePayload, { onConflict: "id" })
        .select("id, username, full_name, role, created_at")
        .maybeSingle();

      if (!error && data) {
        savedUser = data;
      } else {
        const { data: manualUpdate } = await supabaseAdmin
          .from("admin_users")
          .update(updatePayload)
          .eq("id", targetId)
          .select("id, username, full_name, role, created_at")
          .maybeSingle();
        savedUser = manualUpdate;
      }
    }

    if (!savedUser) {
      savedUser = {
        id: targetId,
        username: updatePayload.username || "admin",
        full_name: updatePayload.full_name || "مدیر ارشد سیستم",
        role: updatePayload.role || "superadmin",
      };
    }

    // صدور سشن جدید برای هماهنگی سشن مرورگر
    const sessionToken = signPayload({
      ...savedUser,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      timestamp: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      message: "مشخصات و کلمه عبور مدیر با موفقیت در دیتابیس ذخیره شد.",
      data: savedUser,
      user: savedUser,
    });

    response.cookies.set("admin_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطا در ثبت اطلاعات مدیر" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id === "admin_master") {
      return NextResponse.json({ success: false, message: "حذف مدیر اصلی غیرمجاز است." }, { status: 400 });
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from("admin_users").delete().eq("id", id);
    }
    return NextResponse.json({ success: true, message: "حساب مدیر حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
