import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

interface OrderItemPayload {
  product_id: string;
  quantity: number;
  selected_color?: string;
  selected_storage?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer_name, customer_phone, customer_address, postal_code, coupon_code } = body;

    // ۱. اعتبارسنجی اولیه ساختار سبد خرید
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "سبد خرید خالی است." }, { status: 400 });
    }

    if (!customer_name || !customer_phone || !customer_address) {
      return NextResponse.json({ success: false, message: "اطلاعات گیرنده و آدرس ناقص است." }, { status: 400 });
    }

    const cleanPhone = String(customer_phone).trim().replace("+98", "0");
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل گیرنده نامعتبر است." }, { status: 400 });
    }

    // ۲. استعلام محصولات از دیتابیس برای جلوگیری از دستکاری قیمت در کلاینت
    const productIds = items.map((i: OrderItemPayload) => i.product_id).filter(Boolean);
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return NextResponse.json({ success: false, message: "خطا در بازیابی اطلاعات محصولات انبار." }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((p) => [String(p.id), p]));

    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const item of items as OrderItemPayload[]) {
      const dbProd = productMap.get(String(item.product_id));
      if (!dbProd) {
        return NextResponse.json({ success: false, message: `محصول با شناسه ${item.product_id} در انبار یافت نشد.` }, { status: 400 });
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(dbProd.discount_price || dbProd.price || 0);
      const lineTotal = unitPrice * qty;
      calculatedTotal += lineTotal;

      verifiedItems.push({
        product_id: dbProd.id,
        title: dbProd.title,
        quantity: qty,
        unit_price: unitPrice,
        total_price: lineTotal,
        selected_color: item.selected_color || null,
        selected_storage: item.selected_storage || null,
      });
    }

    // ۳. بررسی و اعمال کوپن تخفیف در سرور
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code && typeof coupon_code === "string") {
      const cleanCoupon = coupon_code.trim().toUpperCase();
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", cleanCoupon)
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const isNotExpired = !coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now();
        const hasUsage = !coupon.usage_limit || (coupon.times_used || 0) < coupon.usage_limit;
        const meetsMin = !coupon.min_purchase || calculatedTotal >= coupon.min_purchase;

        if (isNotExpired && hasUsage && meetsMin) {
          if (coupon.discount_percent || coupon.percent) {
            const p = Number(coupon.discount_percent || coupon.percent || 0);
            discountAmount = Math.round((calculatedTotal * p) / 100);
            if (coupon.max_discount && discountAmount > coupon.max_discount) {
              discountAmount = coupon.max_discount;
            }
          } else if (coupon.discount_amount || coupon.amount) {
            discountAmount = Number(coupon.discount_amount || coupon.amount || 0);
          }
          appliedCoupon = coupon.code;
        }
      }
    }

    const finalPayable = Math.max(0, calculatedTotal - discountAmount);

    // ۴. ثبت نهایی سفارش در جدول orders
    const { data: createdOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name,
        customer_phone: cleanPhone,
        customer_address,
        postal_code: postal_code || null,
        items: verifiedItems,
        total_amount: calculatedTotal,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: appliedCoupon,
        status: "pending_manual_review",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderErr) {
      return NextResponse.json({ success: false, message: orderErr.message }, { status: 500 });
    }

    // ۵. افزایش دفعات استفاده از کوپن
    if (appliedCoupon) {
      try {
        await supabaseAdmin.rpc("increment_coupon_usage", { coupon_code_input: appliedCoupon });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
      message: "سفارش شما با موفقیت ثبت شد و در انتظار تایید پرداخت قرار گرفت.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ایجاد سفارش." }, { status: 500 });
  }
}
