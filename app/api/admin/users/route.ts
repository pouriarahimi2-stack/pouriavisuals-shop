import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { authSecurity } from "@/lib/authSecurity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from("admin_users").select("id, username, full_name, role, created_at").order("created_at", { ascending: true });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, full_name, role } = body;
    if (!username || !password) return NextResponse.json({ success: false, message: "اطلاعات ناقص است" }, { status: 400 });

    const hashedPassword = authSecurity.hashPassword(String(password).trim());
    const payload = {
      id: `adm_${Date.now()}`,
      username: String(username).trim().toLowerCase(),
      password: hashedPassword,
      full_name: String(full_name || username).trim(),
      role: role || "product_manager",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("admin_users").insert([payload]).select("id, username, full_name, role, created_at").single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
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

    const { data, error } = await supabaseAdmin.from("admin_users").upsert(updatePayload, { onConflict: "id" }).select("id, username, full_name, role, created_at").single();
    if (error) throw error;
    return NextResponse.json({ success: true, message: "مشخصات مدیر به‌روز شد", data, user: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id === "admin_master") return NextResponse.json({ success: false, message: "غیرمجاز" }, { status: 400 });
    await supabaseAdmin.from("admin_users").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
