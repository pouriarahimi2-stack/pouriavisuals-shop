import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const cleanCode = String(body.code || "").trim().toUpperCase();

    if (!cleanCode || !body.value) {
      return NextResponse.json({ success: false, message: "کد تخفیف و مقدار تخفیف الزامی هستند." }, { status: 400 });
    }

    const couponId = body.id || ("cpn_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

    const payload: Record<string, any> = {
      id: couponId,
      code: cleanCode,
      type: body.type || "percent",
      discount_type: body.type || "percent",
      value: Number(body.value),
      discount_value: Number(body.value),
      min_order_amount: Number(body.min_order_amount || 0),
      max_discount_amount: body.max_discount_amount ? Number(body.max_discount_amount) : null,
      max_discount: body.max_discount_amount ? Number(body.max_discount_amount) : null,
      usage_limit: body.usage_limit ? Number(body.usage_limit) : 100,
      used_count: body.used_count ? Number(body.used_count) : 0,
      target_type: body.target_type || "all", // 'all', 'category', 'product'
      target_id: body.target_id || null,
      is_active: body.is_active !== false,
      starts_at: body.starts_at ? new Date(body.starts_at).toISOString() : new Date().toISOString(),
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("coupons").select("id").eq("code", cleanCode).maybeSingle();

    if (existing && existing.id !== couponId) {
      return NextResponse.json({ success: false, message: "کد تخفیف تکراری است. یک کد دیگر وارد کنید." }, { status: 400 });
    }

    if (body.id) {
      const { data, error } = await supabaseAdmin.from("coupons").update(payload).eq("id", body.id).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "کد تخفیف با موفقیت ویرایش شد.", data });
    } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("coupons").insert([payload]).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "کد تخفیف با موفقیت در دیتابیس ثبت و فعال شد.", data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "کد تخفیف با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
