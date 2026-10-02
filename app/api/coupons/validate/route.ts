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

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, valid: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." },
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

    const discountType = String(coupon.discount_type || "percent");
    const discountValue = Number(coupon.discount_value || coupon.discount_percent || 0);
    const discountAmount =
      discountType === "percent"
        ? Math.round((cartTotal * discountValue) / 100)
        : Math.min(cartTotal > 0 ? cartTotal : discountValue, discountValue);

    return NextResponse.json(
      {
        success: true,
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_type: discountType,
          discount_value: discountValue,
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
