import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get("count") === "true";
    if (countOnly) {
      const { count } = await supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false);
      return NextResponse.json({ success: true, unread: count || 0 });
    }
    const { data } = await supabaseAdmin.from("messages").select("*").order("created_at", { ascending: false }).limit(100);
    const { count } = await supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false);
    return NextResponse.json({ success: true, messages: data || [], unread: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { id, is_read, reply } = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (is_read !== undefined) updates.is_read = is_read;
    if (reply)                 updates.admin_reply = reply;
    await supabaseAdmin.from("messages").update(updates).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی" }, { status: 400 });
    await supabaseAdmin.from("messages").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
