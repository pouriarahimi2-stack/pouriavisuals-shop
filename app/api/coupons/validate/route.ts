// File Path: app/api/coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function toEnglishText(str: string): string {
  return String(str || "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim()
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = toEnglishText(body.code || body.couponCode || "");
    const cartTotal = Number(body.cartTotal || body.subtotal || body.total || 0);
    const items: any[] = Array.isArray(body.items) ? body.items : [];

    if (!code) {
      return NextResponse.json(
        { success: false, valid: false, message: "لطفاً کد تخفیف را وارد نمایید." },
        { status: 400 }
      );
    }

    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .ilike("code", code)
      .maybeSingle();

    if (!coupon || coupon.is_active === false) {
      return NextResponse.json(
        { success: false, valid: false, message: "کد تخفیف وارد شده نامعتبر یا غیرفعال است." },
        { status: 404 }
      );
    }

    const nowMs = Date.now();
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > nowMs) {
      return NextResponse.json(
        { success: false, valid: false, message: "زمان استفاده از این کد تخفیف هنوز آغاز نشده است." },
        { status: 400 }
      );
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < nowMs) {
      return NextResponse.json(
        { success: false, valid: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." },
        { status: 400 }
      );
    }

    const usageLimit = Number(coupon.usage_limit || 0);
    const usedCount = Number(coupon.times_used ?? coupon.used_count ?? 0);
    if (usageLimit > 0 && usedCount >= usageLimit) {
      return NextResponse.json(
        { success: false, valid: false, message: "ظرفیت مجاز استفاده از این کد تخفیف تکمیل شده است." },
        { status: 400 }
      );
    }

    const minOrder = Number(coupon.min_order_amount || coupon.min_purchase || 0);
    if (minOrder > 0 && cartTotal > 0 && cartTotal < minOrder) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "حداقل مبلغ سبد خرید برای استفاده از این کد " +
            minOrder.toLocaleString("fa-IR") +
            " تومان است.",
        },
        { status: 400 }
      );
    }

    let applicableTotal = cartTotal;
    if (coupon.target_type === "product" && coupon.target_id && items.length > 0) {
      const targetItems = items.filter(
        (it) => String(it.id || it.productId || it.product_id) === String(coupon.target_id)
      );
      if (targetItems.length === 0) {
        return NextResponse.json(
          {
            success: false,
            valid: false,
            message: "این کد تخفیف مختص کالای دیگری است و شامل اقلام فعلی سبد شما نمی‌شود.",
          },
          { status: 400 }
        );
      }
      applicableTotal = targetItems.reduce(
        (acc, it) =>
          acc +
          Number(it.discountPrice ?? it.discount_price ?? it.price ?? 0) *
            Math.max(1, Number(it.quantity || 1)),
        0
      );
    }

    const discountType = String(coupon.discount_type || coupon.type || "percent");
    const discountValue = Number(
      coupon.discount_value ?? coupon.value ?? coupon.discount_percent ?? coupon.discount_amount ?? 0
    );

    let discountAmount =
      discountType === "percent"
        ? Math.round((applicableTotal * discountValue) / 100)
        : Math.min(applicableTotal > 0 ? applicableTotal : discountValue, discountValue);

    const maxDiscount = Number(coupon.max_discount || coupon.max_discount_amount || 0);
    if (maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: discountType,
          discount_type: discountType,
          value: discountValue,
          discount_value: discountValue,
          max_discount: maxDiscount || null,
          target_type: coupon.target_type || "all",
          target_id: coupon.target_id || null,
          discountAmount,
        },
        discountAmount,
        message: "✓ کد تخفیف " + coupon.code + " با موفقیت اعمال شد.",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, valid: false, message: err.message || "خطا در بررسی کد تخفیف." },
      { status: 500 }
    );
  }
}
