// File Path: app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

function buildCouponPayload(body: any, isUpdate = false) {
  const rawCode = String(body.code || "").trim().toUpperCase();
  const type =
    body.discount_type === "fixed" || body.type === "fixed" ? "fixed" : "percent";

  const rawValue =
    type === "percent"
      ? Number(body.discount_percent ?? body.value ?? body.discount_value ?? 0)
      : Number(body.discount_amount ?? body.value ?? body.discount_value ?? 0);

  const minPurchase =
    body.min_purchase !== undefined && body.min_purchase !== null && body.min_purchase !== ""
      ? Number(body.min_purchase)
      : body.min_order_amount !== undefined && body.min_order_amount !== null && body.min_order_amount !== ""
      ? Number(body.min_order_amount)
      : 0;

  const maxDiscount =
    body.max_discount !== undefined && body.max_discount !== null && body.max_discount !== ""
      ? Number(body.max_discount)
      : body.max_discount_amount !== undefined && body.max_discount_amount !== null && body.max_discount_amount !== ""
      ? Number(body.max_discount_amount)
      : null;

  const usageLimit =
    body.usage_limit !== undefined && body.usage_limit !== null && body.usage_limit !== ""
      ? Number(body.usage_limit)
      : 100;

  const payload: Record<string, any> = {
    code: rawCode,
    type,
    discount_type: type,
    value: rawValue,
    discount_value: rawValue,
    discount_percent: type === "percent" ? rawValue : null,
    discount_amount: type === "fixed" ? rawValue : null,
    min_purchase: minPurchase,
    min_order_amount: minPurchase,
    max_discount: maxDiscount,
    max_discount_amount: maxDiscount,
    usage_limit: usageLimit,
    description: body.description ? String(body.description).trim() : null,
    target_type: body.target_type || "all",
    target_id: body.target_id || null,
    expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
    is_active: body.is_active !== false,
    updated_at: new Date().toISOString(),
  };

  if (!isUpdate) {
    payload.starts_at = body.starts_at
      ? new Date(body.starts_at).toISOString()
      : new Date().toISOString();
    payload.created_at = new Date().toISOString();
  }

  return { rawCode, rawValue, payload };
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

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
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { rawCode, rawValue, payload } = buildCouponPayload(body, false);

    if (!rawCode) {
      return NextResponse.json({ success: false, message: "کد تخفیف الزامی است." }, { status: 400 });
    }

    if (isNaN(rawValue) || rawValue <= 0) {
      return NextResponse.json({ success: false, message: "مقدار تخفیف باید بیشتر از صفر باشد." }, { status: 400 });
    }

    const { data: created, error } = await supabaseAdmin
      .from("coupons")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت در دیتابیس ثبت و فعال شد.",
      coupon: created,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کوپن جهت ویرایش الزامی است." }, { status: 400 });
    }

    const { rawCode, rawValue, payload } = buildCouponPayload(body, true);

    if (!rawCode || isNaN(rawValue) || rawValue <= 0) {
      return NextResponse.json({ success: false, message: "کد و مقدار تخفیف معتبر الزامی است." }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("coupons")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت ویرایش و به‌روزرسانی شد.",
      coupon: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("coupons")
      .update({ is_active: Boolean(is_active), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: "وضعیت کوپن تغییر یافت.", coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
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
