import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, totalAmount } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, message: "کد تخفیف معتبر نیست." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderTotal = Number(totalAmount || 0);

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ success: false, message: "کد تخفیف وارد شده یافت نشد یا غیرفعال است." }, { status: 404 });
    }

    // بررسی حداقل میزان خرید
    const minOrder = Number(coupon.min_order_amount || 0);
    if (minOrder > 0 && orderTotal < minOrder) {
      return NextResponse.json({
        success: false,
        message: "حداقل مبلغ سفارش برای اعمال این کوپن " + minOrder.toLocaleString("fa-IR") + " تومان است."
      }, { status: 400 });
    }

    // بررسی تاریخ انقضا
    if (coupon.expires_at) {
      const expiry = new Date(coupon.expires_at);
      if (expiry < new Date()) {
        return NextResponse.json({ success: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." }, { status: 400 });
      }
    }

    // محاسبه تخفیف
    let discount = 0;
    const val = Number(coupon.value || coupon.discount_value || 0);
    const type = coupon.type || coupon.discount_type || "percent";

    if (type === "percent") {
      discount = Math.round((orderTotal * val) / 100);
      const maxDiscount = Number(coupon.max_discount_amount || coupon.max_discount || 0);
      if (maxDiscount > 0 && discount > maxDiscount) {
        discount = maxDiscount;
      }
    } else {
      discount = val;
    }

    if (discount > orderTotal) {
      discount = orderTotal;
    }

    return NextResponse.json({
      success: true,
      message: "کد تخفیف با موفقیت تایید شد.",
      discount,
      code: cleanCode
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در پردازش کوپن." }, { status: 500 });
  }
}
