// File Path: app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { calculateOrderDiscount } from "@/lib/couponValidator";
import { smsService } from "@/services/smsService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز: مشاهده فاکتورها نیازمند لاگین مدیریت است." },
        { status: 401 }
      );
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
    const body = await req.json();
    const { customer_name, phone, province, city, postal_code, address, notes, items, coupon_code } = body;

    const cleanPhone = String(phone || "")
      .trim()
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      return NextResponse.json({ success: false, message: "شماره همراه معتبر ۱۱ رقمی الزامی است." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "سبد خرید شما خالی است." }, { status: 400 });
    }

    const productIds = items.map((i: any) => String(i.productId || i.product_id || i.id));
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available")
      .in("id", productIds);

    const productMap = new Map((dbProducts || []).map((p: any) => [String(p.id), p]));

    let calculatedRawTotal = 0;
    const verifiedItems = items.map((it: any) => {
      const pId = String(it.productId || it.product_id || it.id);
      const realProd = productMap.get(pId);
      const unitPrice = realProd ? Number(realProd.discount_price || realProd.price) : Number(it.price || 0);
      const qty = Math.max(1, Number(it.quantity || 1));
      calculatedRawTotal += unitPrice * qty;

      return {
        id: pId,
        productId: pId,
        title: realProd?.title || it.title || "کالای استودیو",
        price: unitPrice,
        quantity: qty,
        image: it.image || it.image_url || null,
      };
    });

    let finalDiscount = 0;
    let appliedCoupon = null;
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
      phone: cleanPhone,
      province: province || "تهران",
      city: city || "تهران",
      postal_code: postal_code || null,
      address: String(address || "").trim(),
      notes: notes ? String(notes).trim() : null,
      items: verifiedItems,
      total_amount: calculatedRawTotal,
      discount_amount: finalDiscount,
      final_amount: payableAmount,
      coupon_code: appliedCoupon,
      status: "pending",
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

    // ثبت یا به‌روزرسانی خودکار پرونده مشتری در CRM
    try {
      const { data: existingCrm } = await supabaseAdmin
        .from("crm_customers")
        .select("id, total_spent, order_count")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (existingCrm) {
        await supabaseAdmin
          .from("crm_customers")
          .update({
            full_name: customer_name,
            total_spent: Number(existingCrm.total_spent || 0) + payableAmount,
            order_count: Number(existingCrm.order_count || 0) + 1,
            lifecycle_stage: (Number(existingCrm.total_spent || 0) + payableAmount) > 100000000 ? "vip" : "active",
            address: address || undefined,
            postal_code: postal_code || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCrm.id);
      } else {
        await supabaseAdmin.from("crm_customers").insert([{
          id: "crm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          full_name: customer_name,
          phone: cleanPhone,
          province: province || "تهران",
          city: city || "تهران",
          address: address || null,
          postal_code: postal_code || null,
          total_spent: payableAmount,
          order_count: 1,
          lifecycle_stage: "prospect",
          tags: ["ثبت فاکتور"],
          internal_notes: "سفارش ثبت‌شده از ویترین فروشگاه",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      }
    } catch (crmErr) {
      console.warn("CRM auto-sync error:", crmErr);
    }

    // به‌روزرسانی شمارنده مصرف کوپن
    if (couponRecordToUpdate) {
      const currentUsed = Number(couponRecordToUpdate.used_count || 0);
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: currentUsed + 1 })
        .eq("id", couponRecordToUpdate.id);
    }

    // ارسال پیامک ثبت اولیه سفارش
    smsService.sendSMS(
      cleanPhone,
      `${customer_name} عزیز، سفارش شما با شناسه ${orderNumber} در سامانه آکسون ثبت شد. جهت نهایی‌سازی به درگاه منتقل می‌شوید.`
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "سفارش با موفقیت در پایگاه داده ثبت گردید.",
      order: createdOrder,
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
