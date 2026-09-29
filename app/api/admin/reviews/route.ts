import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

// جدول‌های ممکن برای reviews
const REVIEW_TABLES = ["product_reviews", "reviews"];

async function findReviewTable(): Promise<string | null> {
  for (const t of REVIEW_TABLES) {
    const { error } = await supabaseAdmin.from(t).select("id").limit(1);
    if (!error || !error.message.includes("does not exist")) return t;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const table = await findReviewTable();
    if (!table) {
      return NextResponse.json({ success: true, reviews: [], total: 0, note: "جدول دیدگاه هنوز ایجاد نشده." });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ success: true, reviews: data || [], total: data?.length || 0 });
  } catch (err: any) {
    return NextResponse.json({ success: true, reviews: [], total: 0, error: err.message });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;
    const { id, is_approved } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: "شناسه الزامی" }, { status: 400 });
    const table = await findReviewTable();
    if (!table) return NextResponse.json({ success: false, message: "جدول یافت نشد" }, { status: 404 });
    await supabaseAdmin.from(table).update({ is_approved }).eq("id", id);
    return NextResponse.json({ success: true, message: is_approved ? "✓ تایید شد" : "✓ رد شد" });
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
    const table = await findReviewTable();
    if (!table) return NextResponse.json({ success: false, message: "جدول یافت نشد" }, { status: 404 });
    await supabaseAdmin.from(table).delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
