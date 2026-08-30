// File Path: app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, username, full_name, role, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      // ایجاد ادمین پیش‌فرض در صورت خالی بودن جدول
      const defaultUser = {
        id: "admin_master",
        username: "admin",
        password: process.env.ADMIN_PASSWORD || "admin123456",
        full_name: "مدیر ارشد سیستم",
        role: "superadmin",
        created_at: new Date().toISOString(),
      };
      await supabaseAdmin.from("admin_users").upsert([defaultUser], { onConflict: "id" });
      return NextResponse.json({ success: true, data: [defaultUser] });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, full_name, role } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "نام کاربری و رمز عبور الزامی است." }, { status: 400 });
    }

    const payload = {
      id: `adm_${Date.now()}`,
      username: String(username).trim(),
      password: String(password).trim(),
      full_name: String(full_name || username).trim(),
      role: role || "product_manager",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, full_name, role } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه ادمین الزامی است." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (username) updatePayload.username = String(username).trim();
    if (full_name) updatePayload.full_name = String(full_name).trim();
    if (password && String(password).trim().length > 0) updatePayload.password = String(password).trim();
    if (role) updatePayload.role = role;

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}