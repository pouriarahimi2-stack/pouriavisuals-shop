import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { data: coupons, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, coupons: coupons || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const cleanCode = String(body.code || "").trim().toUpperCase();
    if (!cleanCode) return NextResponse.json({ success: false, message: "کد تخفیف الزامی است." }, { status: 400 });

    const payload = {
      code: cleanCode,
      discount_type: body.discount_type || "percent",
      discount_percent: body.discount_percent ? Number(body.discount_percent) : null,
      discount_amount: body.discount_amount ? Number(body.discount_amount) : null,
      min_purchase: body.min_purchase ? Number(body.min_purchase) : null,
      max_discount: body.max_discount ? Number(body.max_discount) : null,
      usage_limit: body.usage_limit ? Number(body.usage_limit) : null,
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      description: body.description || null,
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("coupons").insert([payload]).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, coupon: data, message: "کوپن ایجاد شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });

    const { data, error } = await supabaseAdmin.from("coupons").update(body).eq("id", body.id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, coupon: data, message: "کوپن بروزرسانی شد." });
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
    if (!id) return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });

    await supabaseAdmin.from("coupons").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "کوپن حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
