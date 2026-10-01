// File Path: app/api/coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code;
    const cartTotal = Number(body.cartTotal) || 0;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        { valid: false, message: "لطفاً کد تخفیف را وارد کنید." },
        { status: 400 }
      );
    }

    const cleanCode = rawCode.trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json(
        { valid: false, message: "کد تخفیف وارد شده معتبر نیست یا وجود ندارد." },
        { status: 404 }
      );
    }

    if (coupon.is_active === false) {
      return NextResponse.json(
        { valid: false, message: "این کد تخفیف در حال حاضر غیرفعال است." },
        { status: 400 }
      );
    }

    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > Date.now()) {
      return NextResponse.json(
        { valid: false, message: "زمان استفاده از این کد تخفیف هنوز آغاز نشده است." },
        { status: 400 }
      );
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { valid: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." },
        { status: 400 }
      );
    }

    const usedCount = Number(coupon.times_used ?? coupon.used_count ?? 0);
    if (
      typeof coupon.usage_limit === "number" &&
      coupon.usage_limit > 0 &&
      usedCount >= coupon.usage_limit
    ) {
      return NextResponse.json(
        { valid: false, message: "سقف ظرفیت استفاده از این کد تخفیف تکمیل شده است." },
        { status: 400 }
      );
    }

    const minRequired = Number(coupon.min_purchase ?? coupon.min_order_amount ?? 0);
    if (minRequired > 0 && cartTotal < minRequired) {
      return NextResponse.json(
        {
          valid: false,
          message:
            "این کد تنها برای سفارش‌های بالاتر از " +
            minRequired.toLocaleString("fa-IR") +
            " تومان معتبر است.",
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    const isPercent =
      coupon.discount_type === "percent" ||
      coupon.type === "percent" ||
      Boolean(coupon.discount_percent) ||
      Boolean(coupon.percent);

    const maxCap = Number(coupon.max_discount ?? coupon.max_discount_amount ?? 0);

    if (isPercent) {
      const pct = Number(
        coupon.discount_percent ?? coupon.percent ?? coupon.value ?? coupon.discount_value ?? 0
      );
      discountAmount = Math.round((cartTotal * pct) / 100);
      if (maxCap > 0 && discountAmount > maxCap) {
        discountAmount = maxCap;
      }
    } else {
      discountAmount = Number(
        coupon.discount_amount ?? coupon.amount ?? coupon.value ?? coupon.discount_value ?? 0
      );
    }

    discountAmount = Math.max(0, Math.min(discountAmount, cartTotal));

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_amount: discountAmount,
        discount_percent: isPercent
          ? Number(coupon.discount_percent ?? coupon.percent ?? coupon.value ?? coupon.discount_value ?? 0)
          : null,
        description: coupon.description || "تخفیف ویژه سفارش",
      },
      message: "کد تخفیف با موفقیت روی سفارش اعمال شد.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || "خطا در پردازش کد تخفیف." },
      { status: 500 }
    );
  }
}
