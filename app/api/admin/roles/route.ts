import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
import { authSecurity } from "@/lib/authSecurity";
import { randomUUID } from "crypto";
import { ROLE_PERMISSIONS, AdminRole } from "@/lib/rolePermissions";
export const dynamic = "force-dynamic";

function toRole(raw: unknown): AdminRole | null {
  return typeof raw === "string" && raw in ROLE_PERMISSIONS ? raw as AdminRole : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  const { data } = await supabaseAdmin.from("admin_users").select("id,username,full_name,role,created_at").order("created_at", { ascending: true });
  return NextResponse.json({ success: true, users: data || [], roles: ROLE_PERMISSIONS });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.session?.role !== "superadmin") return NextResponse.json({ success: false, message: "فقط مدیر ارشد" }, { status: 403 });
  const body = await req.json();
  const role = toRole(body.role);
  if (!body.username || !body.password || !role)
    return NextResponse.json({ success: false, message: "نام کاربری، رمز و نقش الزامی" }, { status: 400 });
  const { data: ex } = await supabaseAdmin.from("admin_users").select("id").eq("username", String(body.username).toLowerCase()).maybeSingle();
  if (ex) return NextResponse.json({ success: false, message: "نام کاربری تکراری است" }, { status: 409 });
  const hashed = authSecurity.hashPassword(String(body.password));
  await supabaseAdmin.from("admin_users").insert([{ id: randomUUID(), username: String(body.username).toLowerCase(), full_name: body.full_name || body.username, role, password_hash: hashed, password: hashed, created_at: new Date().toISOString() }]);
  return NextResponse.json({ success: true, message: "کاربر «" + body.username + "» با نقش «" + ROLE_PERMISSIONS[role].label + "» ثبت شد." });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.session?.role !== "superadmin") return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ success: false, message: "شناسه الزامی" }, { status: 400 });
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const role = toRole(body.role);
  if (role) updates.role = role;
  if (body.full_name) updates.full_name = body.full_name;
  if (body.password && String(body.password).length >= 4) { const h = authSecurity.hashPassword(String(body.password)); updates.password_hash = h; updates.password = h; }
  await supabaseAdmin.from("admin_users").update(updates).eq("id", body.id);
  return NextResponse.json({ success: true, message: "بروزرسانی انجام شد." });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  if (auth.session?.role !== "superadmin") return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی" }, { status: 400 });
  await supabaseAdmin.from("admin_users").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
