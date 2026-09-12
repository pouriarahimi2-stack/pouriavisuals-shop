import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { calculateOrderDiscount } from "@/lib/couponValidator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");

    let query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (phone) query = query.eq("phone", phone);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, orders: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, phone, province, city, postal_code, address, notes, items, coupon_code } = body;

    const cleanPhone = String(phone || "").trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json({ success: false, message: "شماره تماس ۱۱ رقمی معتبر الزامی است." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "سبد خرید خالی است." }, { status: 400 });
    }

    // ۱. استعلام قیمت‌های واقعی از جدول محصولات در دیتابیس (ضد دستکاری کلاینت)
    const productIds = items.map((i: any) => i.id);
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available")
      .in("id", productIds);

    const productMap = new Map((dbProducts || []).map((p: any) => [String(p.id), p]));

    let calculatedRawTotal = 0;
    const verifiedItems = items.map((it: any) => {
      const realProd = productMap.get(String(it.id));
      const unitPrice = realProd ? Number(realProd.discount_price || realProd.price) : Number(it.price || 0);
      const qty = Math.max(1, Number(it.quantity || 1));
      calculatedRawTotal += unitPrice * qty;

      return {
        id: it.id,
        title: realProd?.title || it.title || "محصول استودیویی",
        price: unitPrice,
        quantity: qty,
        image: it.image || null,
      };
    });

    // ۲. بررسی کوپن تخفیف با قوانین سخت‌گیرانه (رفع باگ بند ۴.۸)
    let finalDiscount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const cleanCoupon = String(coupon_code).trim().toUpperCase();
      const { data: couponRecord } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", cleanCoupon)
        .maybeSingle();

      const validation = calculateOrderDiscount(couponRecord, calculatedRawTotal);
      if (validation.valid) {
        finalDiscount = validation.discountAmount;
        appliedCoupon = cleanCoupon;
      }
    }

    const payableAmount = Math.max(0, calculatedRawTotal - finalDiscount);
    const orderNumber = "AXON-" + Date.now().toString().slice(-6) + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();

    const orderPayload = {
      order_number: orderNumber,
      customer_name: String(customer_name || "مشتری").trim(),
      phone: cleanPhone,
      province: province || "تهران",
      city: city || "تهران",
      postal_code: postal_code || null,
      address: String(address || "").trim(),
      notes: notes || null,
      items: verifiedItems,
      total_amount: calculatedRawTotal,
      discount_amount: finalDiscount,
      final_amount: payableAmount,
      coupon_code: appliedCoupon,
      status: "pending",
      payment_status: "unpaid",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    if (orderErr) throw orderErr;

    return NextResponse.json({
      success: true,
      message: "سفارش با موفقیت ثبت شد.",
      order: createdOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
