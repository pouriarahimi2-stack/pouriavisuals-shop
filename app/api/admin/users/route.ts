// File Path: app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, username, full_name, role, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("admin_users GET warning:", error.message);
    }

    if (!data || data.length === 0) {
      const defaultPassword = process.env.ADMIN_PASSWORD || "admin123456";
      const hashedPassword = authSecurity.hashPassword(defaultPassword);
      const defaultUser = {
        id: "admin_master",
        username: "admin",
        password: hashedPassword,
        full_name: "مدیر ارشد سیستم",
        role: "superadmin",
        created_at: new Date().toISOString(),
      };
      await supabaseAdmin.from("admin_users").upsert([defaultUser], { onConflict: "id" });
      return NextResponse.json({
        success: true,
        data: [
          {
            id: defaultUser.id,
            username: defaultUser.username,
            full_name: defaultUser.full_name,
            role: defaultUser.role,
            created_at: defaultUser.created_at,
          },
        ],
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, full_name, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    if (String(password).trim().length < 6) {
      return NextResponse.json(
        { success: false, message: "کلمه عبور باید حداقل ۶ کاراکتر باشد." },
        { status: 400 }
      );
    }

    const hashedPassword = authSecurity.hashPassword(String(password).trim());
    const payload = {
      id: `adm_${Date.now()}`,
      username: String(username).trim().toLowerCase(),
      password: hashedPassword,
      full_name: String(full_name || username).trim(),
      role: role || "product_manager",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .insert([payload])
      .select("id, username, full_name, role, created_at")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطا در ثبت کاربر" }, { status: 500 });
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
      if (String(password).trim().length < 6) {
        return NextResponse.json(
          { success: false, message: "کلمه عبور باید حداقل ۶ کاراکتر باشد." },
          { status: 400 }
        );
      }
      updatePayload.password = authSecurity.hashPassword(String(password).trim());
    }

    // استفاده از upsert برای جلوگیری از خطای عدم وجود رکورد
    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .upsert(updatePayload, { onConflict: "id" })
      .select("id, username, full_name, role, created_at")
      .single();

    if (error) {
      console.error("Admin user update error:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "مشخصات مدیر با موفقیت به‌روزرسانی شد.",
      data,
      user: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطای سرور در ویرایش" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    }

    if (id === "admin_master") {
      return NextResponse.json({ success: false, message: "حذف مدیر ارشد سیستم امکان‌پذیر نیست." }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "کاربر با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "خطا در حذف" }, { status: 500 });
  }
}