import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { authSecurity } from "@/lib/authSecurity";
import { randomUUID } from "crypto";
import { ROLE_PERMISSIONS, AdminRole } from "@/lib/rolePermissions";

export const dynamic = "force-dynamic";

function toAdminRole(raw: unknown): AdminRole | null {
  if (typeof raw !== "string") return null;
  return (raw as string) in ROLE_PERMISSIONS ? (raw as AdminRole) : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const { data: users } = await supabaseAdmin
      .from("admin_users")
      .select("id,username,full_name,role,created_at,updated_at")
      .order("created_at", { ascending: true });
    return NextResponse.json({ success: true, users: users || [], roles: ROLE_PERMISSIONS });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.session?.role !== "superadmin")
    return NextResponse.json({ success: false, message: "فقط مدیر ارشد می‌تواند کاربر جدید اضافه کند." }, { status: 403 });
  try {
    const body = await req.json();
    const { username, password, full_name } = body;
    const role = toAdminRole(body.role);
    if (!username || !password || !role)
      return NextResponse.json({ success: false, message: "نام کاربری، رمز عبور و نقش معتبر الزامی‌اند." }, { status: 400 });
    const { data: existing } = await supabaseAdmin.from("admin_users").select("id").eq("username", username.toLowerCase()).maybeSingle();
    if (existing)
      return NextResponse.json({ success: false, message: "این نام کاربری قبلاً ثبت شده است." }, { status: 409 });
    const hashed = authSecurity.hashPassword(password);
    const { error } = await supabaseAdmin.from("admin_users").insert([{
      id: randomUUID(), username: username.toLowerCase().trim(),
      full_name: full_name || username, role,
      password_hash: hashed, password: hashed,
      created_at: new Date().toISOString(),
    }]);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "✓ کاربر «" + username + "» با نقش «" + ROLE_PERMISSIONS[role].label + "» ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.session?.role !== "superadmin")
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 403 });
  try {
    const body = await req.json();
    const { id, full_name, password } = body;
    const role = toAdminRole(body.role);
    if (!id) return NextResponse.json({ success: false, message: "شناسه کاربر الزامی است." }, { status: 400 });
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role) updates.role = role;
    if (full_name) updates.full_name = full_name;
    if (password && String(password).length >= 4) {
      const hashed = authSecurity.hashPassword(String(password));
      updates.password_hash = hashed;
      updates.password = hashed;
    }
    const { error } = await supabaseAdmin.from("admin_users").update(updates).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "✓ اطلاعات کاربر بروزرسانی شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.session?.role !== "superadmin")
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    const { data: self } = await supabaseAdmin.from("admin_users").select("username").eq("id", id).maybeSingle();
    if (self?.username === auth.session?.username)
      return NextResponse.json({ success: false, message: "نمی‌توانید حساب خود را حذف کنید." }, { status: 400 });
    await supabaseAdmin.from("admin_users").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "✓ کاربر با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
