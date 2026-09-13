import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAdminAuth(req: NextRequest) {
  const adminToken = req.cookies.get("admin_session_token")?.value;
  return Boolean(adminToken && adminToken.length >= 20);
}

async function logAudit(req: NextRequest, action: string, targetId: string, details: any) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "local";

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_username: "admin",
      action,
      target_resource: `coupon:${targetId}`,
      details,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]:", err);
  }
}

// ۱. دریافت تمام کوپن‌ها (GET)
export async function GET() {
  try {
    const { data: coupons, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      coupons: coupons || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در واکشی کوپن‌ها." },
      { status: 500 }
    );
  }
}

// ۲. ایجاد کوپن جدید (POST)
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      discount_type,
      discount_percent,
      discount_amount,
      min_purchase,
      max_discount,
      usage_limit,
      expires_at,
      description,
      is_active,
    } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ success: false, message: "کد تخفیف الزامی است." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanCode.length < 3) {
      return NextResponse.json({ success: false, message: "کد تخفیف باید حداقل ۳ کاراکتر مجاز باشد." }, { status: 400 });
    }

    const percent = discount_percent !== undefined && discount_percent !== null ? Number(discount_percent) : null;
    if (percent !== null && (isNaN(percent) || percent <= 0 || percent > 100)) {
      return NextResponse.json({ success: false, message: "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد." }, { status: 400 });
    }

    const amount = discount_amount !== undefined && discount_amount !== null ? Number(discount_amount) : null;
    if (amount !== null && (isNaN(amount) || amount < 0)) {
      return NextResponse.json({ success: false, message: "مبلغ تخفیف ثابت نامعتبر است." }, { status: 400 });
    }

    const payload = {
      code: cleanCode,
      discount_type: discount_type || (percent ? "percent" : "fixed"),
      discount_percent: percent,
      discount_amount: amount,
      min_purchase: min_purchase ? Math.max(0, Number(min_purchase)) : null,
      max_discount: max_discount ? Math.max(0, Number(max_discount)) : null,
      usage_limit: usage_limit ? Math.max(1, Number(usage_limit)) : null,
      times_used: 0,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      description: typeof description === "string" ? description.trim() : null,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
    };

    const { data: newCoupon, error } = await supabaseAdmin
      .from("coupons")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "CREATE_COUPON", cleanCode, { payload });

    return NextResponse.json({
      success: true,
      coupon: newCoupon,
      message: "کد تخفیف جدید با موفقیت ایجاد شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت کد تخفیف." },
      { status: 500 }
    );
  }
}

// ۳. ویرایش کوپن (PUT)
export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });
    }

    if (updates.code) {
      updates.code = String(updates.code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    }
    if (updates.discount_percent !== undefined && updates.discount_percent !== null) {
      const p = Number(updates.discount_percent);
      if (isNaN(p) || p <= 0 || p > 100) {
        return NextResponse.json({ success: false, message: "درصد تخفیف نامعتبر است." }, { status: 400 });
      }
      updates.discount_percent = p;
    }
    if (updates.expires_at) {
      updates.expires_at = new Date(updates.expires_at).toISOString();
    }

    const { data: updatedCoupon, error } = await supabaseAdmin
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(req, "UPDATE_COUPON", String(id), { updates });

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
      message: "کوپن با موفقیت ویرایش شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ویرایش کوپن." },
      { status: 500 }
    );
  }
}

// ۴. حذف کوپن (DELETE)
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
    if (error) throw error;

    await logAudit(req, "DELETE_COUPON", String(id), { deleted_at: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت حذف گردید.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در حذف کوپن." },
      { status: 500 }
    );
  }
}
