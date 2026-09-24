import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .select("*, products(title)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, reviews: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const { id, is_approved } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی است" }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .update({ is_approved })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: is_approved ? "✓ تایید شد" : "✓ رد شد" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی است" }, { status: 400 });
    await supabaseAdmin.from("product_reviews").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "✓ دیدگاه حذف شد" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}