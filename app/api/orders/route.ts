import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { calculateOrderDiscount } from "@/lib/couponValidator";
import { smsService } from "@/services/smsService";
import { checkRateLimit } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

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
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateCheck = await checkRateLimit(clientIp, "create_order", 10, 15);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, message: "تعداد ثبت سفارشات از این IP بیش از حد مجاز است." }, { status: 429 });
    }

    const body = await req.json();
    const { customer_name, customer_phone, phone, province, city, postal_code, address, customer_address, notes, items, coupon_code } = body;

    const rawPhone = customer_phone || phone || "";
    const cleanPhone = String(rawPhone)
      .trim()
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      return NextResponse.json({ success: false, message: "شماره همراه معتبر ۱۱ رقمی الزامی است." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "سبد خرید شما خالی است." }, { status: 400 });
    }

    const finalAddress = String(customer_address || address || "").trim();
    if (finalAddress.length < 5) {
      return NextResponse.json({ success: false, message: "نشانی پستی دقیق جهت ارسال مرسوله الزامی است." }, { status: 400 });
    }

    const productIds = items.map((i: any) => String(i.productId || i.product_id || i.id)).filter(Boolean);
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, title, name, price, discount_price, stock, is_available")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return NextResponse.json({ success: false, message: "خطا در بازیابی اطلاعات موجودی محصولات." }, { status: 500 });
    }

    const productMap = new Map((dbProducts || []).map((p: any) => [String(p.id), p]));

    let calculatedRawTotal = 0;
    const verifiedItems = [];

    for (const it of items) {
      const pId = String(it.productId || it.product_id || it.id);
      const realProd = productMap.get(pId);

      if (!realProd) {
        return NextResponse.json({ success: false, message: "کالای مورد نظر در انبار سیستم یافت نشد." }, { status: 400 });
      }

      const requestedQty = Math.max(1, Number(it.quantity || 1));
      const currentStock = realProd.stock !== null && realProd.stock !== undefined ? Number(realProd.stock) : 999;

      if (currentStock < requestedQty) {
        return NextResponse.json({ success: false, message: "موجودی کالا کافی نیست." }, { status: 400 });
      }

      const unitPrice = realProd.discount_price && Number(realProd.discount_price) > 0
        ? Number(realProd.discount_price)
        : Number(realProd.price || 0);

      const lineTotal = unitPrice * requestedQty;
      calculatedRawTotal += lineTotal;

      verifiedItems.push({
        id: pId,
        productId: pId,
        product_id: pId,
        title: realProd.title || realProd.name || it.title,
        price: unitPrice,
        unit_price: unitPrice,
        quantity: requestedQty,
        total_price: lineTotal,
        image: it.image || it.image_url || null,
      });
    }

    let finalDiscount = 0;
    let appliedCoupon: string | null = null;
    let couponRecordToUpdate: any = null;

    if (coupon_code) {
      const cleanCoupon = String(coupon_code).trim().toUpperCase();
      const { data: couponRecord } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", cleanCoupon)
        .eq("is_active", true)
        .maybeSingle();

      if (couponRecord) {
        const validation = calculateOrderDiscount(couponRecord, calculatedRawTotal);
        if (validation.valid) {
          finalDiscount = validation.discountAmount;
          appliedCoupon = cleanCoupon;
          couponRecordToUpdate = couponRecord;
        }
      }
    }

    const payableAmount = Math.max(0, calculatedRawTotal - finalDiscount);
    const orderNumber = "AXON-" + Date.now().toString().slice(-6) + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();
    const orderId = "ord_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    const orderPayload = {
      id: orderId,
      order_number: orderNumber,
      customer_name: String(customer_name || "مشتری گرامی").trim(),
      customer_phone: cleanPhone,
      phone: cleanPhone,
      province: province || "تهران",
      city: city || "تهران",
      postal_code: postal_code || null,
      customer_address: finalAddress,
      address: finalAddress,
      notes: notes ? String(notes).trim() : null,
      items: verifiedItems,
      total_amount: calculatedRawTotal,
      discount_amount: finalDiscount,
      final_amount: payableAmount,
      coupon_code: appliedCoupon,
      status: "pending_manual_review",
      payment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    if (orderErr) throw orderErr;

    for (const it of verifiedItems) {
      try {
        const p = productMap.get(it.productId);
        if (p && p.stock !== null && p.stock !== undefined) {
          const nextStock = Math.max(0, Number(p.stock) - Number(it.quantity));
          await supabaseAdmin
            .from("products")
            .update({ stock: nextStock, is_available: nextStock > 0 })
            .eq("id", it.productId);
        }
      } catch (stkErr) {
        console.warn("Stock decrease warning:", stkErr);
      }
    }

    if (couponRecordToUpdate) {
      const currentUsed = Number(couponRecordToUpdate.used_count || couponRecordToUpdate.times_used || 0);
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: currentUsed + 1, times_used: currentUsed + 1 })
        .eq("id", couponRecordToUpdate.id);
    }

    smsService.sendSMS(
      cleanPhone,
      "مشتری گرامی، سفارش شما در آکسون ثبت شد. سپاس از اعتماد شما."
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "سفارش با موفقیت ثبت گردید.",
      order: createdOrder,
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
