import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const { id, status, tracking_code } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه سفارش الزامی است." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (tracking_code !== undefined) updatePayload.tracking_code = tracking_code;

    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, order: updated, message: "وضعیت سفارش بروزرسانی شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
