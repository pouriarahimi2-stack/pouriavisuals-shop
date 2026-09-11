import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, coupon_code } = body;

    // ۱. اعتبارسنجی اولیه ساختار اطلاعات کاربر
    const customerName = String(customer?.fullName || customer?.name || body.customer_name || "").trim();
    const cleanPhone = String(customer?.phone || body.phone || "").trim().replace(/\D/g, "");
    const address = String(customer?.address || body.address || "").trim();

    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ success: false, message: "نام و نام خانوادگی خریدار الزامی است." }, { status: 400 });
    }

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود." }, { status: 400 });
    }

    if (!address || address.length < 6) {
      return NextResponse.json({ success: false, message: "نشانی پستی دقیق الزامی است." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "سبد خرید خالی است." }, { status: 400 });
    }

    // ۲. دریافت قیمت و موجودی واقعی از دیتابیس (سرور تنها منبع تعیین قیمت است)
    const productIds = items.map((i: any) => String(i.productId || i.product_id || i.id));
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return NextResponse.json({ success: false, message: "خطا در استعلام محصولات از پایگاه داده." }, { status: 500 });
    }

    let calculatedRawTotal = 0;
    const verifiedItems: any[] = [];
    const stockReservationPayload: any[] = [];

    for (const clientItem of items) {
      const pId = String(clientItem.productId || clientItem.product_id || clientItem.id);
      const dbProd = dbProducts.find((p) => String(p.id) === pId);

      if (!dbProd) {
        return NextResponse.json({ success: false, message: `کالای ${pId} دیگر در سیستم موجود نیست.` }, { status: 400 });
      }

      const qty = Math.max(1, Math.floor(Number(clientItem.quantity || 1)));
      if (dbProd.stock !== undefined && dbProd.stock < qty) {
        return NextResponse.json({
          success: false,
          message: `موجودی کالای «${dbProd.title}» ناکافی است (موجودی انبار: ${dbProd.stock} عدد).`
        }, { status: 400 });
      }

      const unitPrice = Number(dbProd.discount_price || dbProd.price || 0);
      calculatedRawTotal += unitPrice * qty;

      verifiedItems.push({
        product_id: dbProd.id,
        title: dbProd.title,
        price: unitPrice,
        quantity: qty
      });

      stockReservationPayload.push({
        product_id: dbProd.id,
        quantity: qty
      });
    }

    // ۳. اعتبارسنجی مستقل کد تخفیف در سرور
    let discountAmount = 0;
    let validCouponCode: string | null = null;

    if (coupon_code) {
      const cleanCoupon = String(coupon_code).trim().toUpperCase();
      const { data: couponRecord } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", cleanCoupon)
        .eq("is_active", true)
        .maybeSingle();

      if (couponRecord) {
        const isPercent = couponRecord.type === "percent" || couponRecord.discount_type === "percent";
        const val = Number(couponRecord.value || couponRecord.discount_value || 0);
        if (isPercent) {
          discountAmount = Math.round((calculatedRawTotal * val) / 100);
          if (couponRecord.max_discount && discountAmount > couponRecord.max_discount) {
            discountAmount = Number(couponRecord.max_discount);
          }
        } else {
          discountAmount = val;
        }
        validCouponCode = cleanCoupon;
      }
    }

    const finalCalculatedPayable = Math.max(0, calculatedRawTotal - discountAmount);

    // ۴. شناسه فاکتور ضد تکرار (Collision-Proof Order ID)
    const uniqueSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `AX-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;

    // ۵. ثبت سفارش با وضعیت قطعی pending (کلاینت اجازه تعیین status را ندارد)
    const orderRecord = {
      id: orderNumber,
      order_number: orderNumber,
      customer_name: customerName,
      phone: cleanPhone,
      province: customer?.province || body.province || "نامشخص",
      city: customer?.city || body.city || "نامشخص",
      address: address,
      postal_code: customer?.postalCode || body.postal_code || null,
      items: verifiedItems,
      total_amount: calculatedRawTotal,
      discount_amount: discountAmount,
      coupon_code: validCouponCode,
      final_amount: finalCalculatedPayable,
      status: "pending", // صرفاً سرور تعیین می‌کند
      payment_status: "unpaid", // به هیچ وجه توسط کاربر paid نمی‌شود
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdOrder, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert([orderRecord])
      .select()
      .single();

    if (insertErr || !createdOrder) {
      throw insertErr || new Error("خطا در ایجاد سفارش.");
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      payableAmount: finalCalculatedPayable
    });
  } catch (err: any) {
    console.error("Secure Order Creation Error:", err);
    return NextResponse.json({ success: false, message: "خطای امنیتی سرور در ایجاد سفارش." }, { status: 500 });
  }
}
