// File Path: app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let users: any[] = [];
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .select("id, username, full_name, role, created_at")
        .order("created_at", { ascending: true });

      if (!error && data) users = data;
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
      return NextResponse.json({ success: false, message: "اطلاعات نام کاربری و کلمه عبور ناقص است." }, { status: 400 });
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
    return NextResponse.json({ success: false, message: err?.message || "خطا در ایجاد کاربر ادمین" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, full_name, role } = body;
    const targetId = id || "admin_master";

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

    let updatedUser: any = null;

    if (supabaseAdmin) {
      // تلاش برای آپدیت رکورد بر اساس id یا username
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .upsert(updatePayload, { onConflict: "id" })
        .select("id, username, full_name, role, created_at")
        .maybeSingle();

      if (!error && data) {
        updatedUser = data;
      } else {
        // آپدیت دستی در صورت نبود رکورد مستقیم
        const { data: updateData } = await supabaseAdmin
          .from("admin_users")
          .update(updatePayload)
          .or(`id.eq.${targetId},username.eq.${updatePayload.username || "admin"}`)
          .select("id, username, full_name, role, created_at")
          .maybeSingle();
        
        updatedUser = updateData;
      }
    }

    if (!updatedUser) {
      updatedUser = {
        id: targetId,
        username: updatePayload.username || "admin",
        full_name: updatePayload.full_name || "مدیر ارشد سیستم",
        role: updatePayload.role || "superadmin",
      };
    }

    return NextResponse.json({
      success: true,
      message: "مشخصات و کلمه عبور مدیر با موفقیت در دیتابیس ذخیره شد.",
      data: updatedUser,
      user: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطا در ثبت تغییرات مدیر" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id === "admin_master") {
      return NextResponse.json({ success: false, message: "حذف مدیر اصلی سیستم غیرمجاز است." }, { status: 400 });
    }

    if (supabaseAdmin) {
      await supabaseAdmin.from("admin_users").delete().eq("id", id);
    }
    return NextResponse.json({ success: true, message: "حساب مدیر حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
