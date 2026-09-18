import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

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
    const rawCode = String(body.code || "").trim().toUpperCase();

    if (!rawCode) {
      return NextResponse.json({ success: false, message: "کد تخفیف الزامی است." }, { status: 400 });
    }

    const val = Number(body.value || body.discount_value || 0);
    if (val <= 0) {
      return NextResponse.json({ success: false, message: "مقدار تخفیف باید بیشتر از صفر باشد." }, { status: 400 });
    }

    const type = body.type === "fixed" ? "fixed" : "percent";
    const payload = {
      code: rawCode,
      type,
      discount_type: type,
      value: val,
      discount_value: val,
      min_order_amount: body.min_order_amount ? Number(body.min_order_amount) : 0,
      max_discount: body.max_discount_amount || body.max_discount ? Number(body.max_discount_amount || body.max_discount) : null,
      max_discount_amount: body.max_discount_amount || body.max_discount ? Number(body.max_discount_amount || body.max_discount) : null,
      usage_limit: body.usage_limit ? Number(body.usage_limit) : 100,
      target_type: body.target_type || "all",
      target_id: body.target_id || null,
      starts_at: body.starts_at ? new Date(body.starts_at).toISOString() : new Date().toISOString(),
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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
