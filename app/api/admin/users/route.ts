import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, full_name, role, created_at");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, users: data });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await req.json();
  const { username, password, full_name, role } = body;

  if (!username || !password) {
    return NextResponse.json({ success: false, message: "اطلاعات ناقص است" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("admin_users").insert({
    username: username.trim().toLowerCase(),
    password: password.trim(),
    full_name: full_name?.trim() || username.trim(),
    role: role || "admin",
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, user: data });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ success: false, message: "شناسه کاربر الزامی است" }, { status: 400 });

  const { error } = await supabaseAdmin.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "کاربر با موفقیت حذف شد." });
}
