// File Path: app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

function buildCouponPayload(body: any, isUpdate = false) {
  const rawCode = String(body.code || "").trim().toUpperCase();
  const discountType =
    body.discount_type === "fixed" || body.type === "fixed" ? "fixed" : "percent";

  const rawValue = Number(
    body.discount_percent ??
      body.discount_amount ??
      body.value ??
      body.discount_value ??
      body.amount ??
      0
  );

  const minPurchase = Number(body.min_purchase ?? body.min_order_amount ?? 0);
  const maxDiscount = Number(body.max_discount ?? body.max_discount_amount ?? 0);
  const usageLimit = Number(body.usage_limit ?? 100);

  const couponId = body.id || ("cpn_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

  const payload: Record<string, any> = {
    id: couponId,
    code: rawCode,
    type: discountType,
    discount_type: discountType,
    value: rawValue,
    discount_value: rawValue,
    discount_amount: rawValue,
    amount: rawValue,
    min_purchase: minPurchase,
    min_order_amount: minPurchase,
    max_discount: maxDiscount,
    usage_limit: usageLimit,
    target_type: body.target_type || "all",
    target_id: body.target_id || null,
    starts_at: body.starts_at ? new Date(body.starts_at).toISOString() : new Date().toISOString(),
    expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
    is_active: body.is_active !== false,
    publish_to_header: body.publish_to_header !== false,
    updated_at: new Date().toISOString(),
  };

  if (body.description) {
    payload.description = String(body.description).trim();
  }

  if (!isUpdate) {
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
      return NextResponse.json({ success: false, message: "کد و مقدار تخفیف معتبر است." }, { status: 400 });
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
    const { id, is_active, publish_to_header } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کوپن الزامی است." }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof is_active === "boolean") updateData.is_active = is_active;
    if (typeof publish_to_header === "boolean") updateData.publish_to_header = publish_to_header;

    const { data: updated, error } = await supabaseAdmin
      .from("coupons")
      .update(updateData)
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

    const { data: couponToDelete } = await supabaseAdmin
      .from("coupons")
      .select("code")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
    if (error) throw error;

    // پاکسازی کامل نوار اعلان در دیتابیس در صورت حضور متن این کوپن
    if (couponToDelete?.code) {
      const { data: siteInfo } = await supabaseAdmin
        .from("site_info")
        .select("theme_builder_config, header_announcement")
        .limit(1)
        .maybeSingle();

      if (siteInfo) {
        const tbCfg = siteInfo.theme_builder_config || {};
        const globalH = tbCfg.globalHeader || {};
        const currentText = String(globalH.announcementText || siteInfo.header_announcement || "");

        if (currentText.includes(couponToDelete.code) || currentText.includes("TECH-1A51") || currentText.includes("AXON-")) {
          const updatedTb = {
            ...tbCfg,
            globalHeader: {
              ...globalH,
              announcementEnabled: false,
              announcementText: "",
            },
          };
          await supabaseAdmin
            .from("site_info")
            .update({ theme_builder_config: updatedTb, header_announcement: null })
            .limit(1);
        }
      }
    }

    return NextResponse.json({ success: true, message: "کد تخفیف حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}