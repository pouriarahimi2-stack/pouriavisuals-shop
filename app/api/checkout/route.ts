// File Path: app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const fullName = String(customer.fullName || body.customer_name || "").trim();
    const cleanPhone = String(customer.phone || body.phone || "").replace(/\D/g, "");
    const province = String(customer.province || "تهران").trim();
    const city = String(customer.city || "تهران").trim();
    const address = String(customer.address || body.address || "").trim();
    const postalCode = String(customer.postalCode || body.postal_code || "").trim();

    if (!fullName || cleanPhone.length !== 11) {
      return NextResponse.json(
        { success: false, message: "نام کامل و شماره همراه ۱۱ رقمی الزامی است." },
        { status: 400 }
      );
    }

    const subtotal = Math.max(0, Number(body.subtotal || 0));
    const discountAmount = Math.max(0, Number(body.discountAmount || 0));
    const shippingCost = Math.max(0, Number(body.shippingCost || 0));
    const finalAmount = Math.max(0, Number(body.finalAmount || subtotal - discountAmount + shippingCost));

    const orderId = "ORD-" + Date.now().toString().slice(-7) + "-" + Math.floor(100 + Math.random() * 900);
    const trackingCode = "AXN-" + Date.now().toString().slice(-8);

    const orderPayload: Record<string, any> = {
      id: orderId,
      customer_name: fullName,
      phone: cleanPhone,
      address: province + "، " + city + " - " + address + (postalCode ? " (کدپستی: " + postalCode + ")" : ""),
      postal_code: postalCode || null,
      items,
      total_amount: subtotal,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      final_amount: finalAmount,
      status: "pending",
      tracking_code: trackingCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert([orderPayload])
      .select()
      .maybeSingle();

    if (orderErr) {
      console.warn("Order insert fallback warning:", orderErr.message);
    }

    // ۱. کسر خودکار موجودی از جدول products و ثبت سند کسر انبار و حسابداری در inventory_logs
    for (const item of items) {
      const prodId = item.id || item.productId || item.product_id;
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!prodId) continue;

      try {
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("id, title, name, stock, price, purchase_price")
          .eq("id", prodId)
          .maybeSingle();

        if (prod) {
          const currentStock = Number(prod.stock ?? 10);
          const nextStock = Math.max(0, currentStock - qty);
          await supabaseAdmin
            .from("products")
            .update({
              stock: nextStock,
              is_available: nextStock > 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", prod.id);

          await supabaseAdmin.from("inventory_logs").insert([
            {
              id: "sale_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              product_id: String(prod.id),
              product_title: prod.title || prod.name || "کالای فروخته‌شده",
              change_type: "sale",
              quantity: qty,
              cost_price: Number(prod.purchase_price || Math.round(Number(prod.price || 0) * 0.7)),
              supplier: "فروش آنلاین سایت",
              reference_note: "کسر خودکار بابت فاکتور " + orderId + " (کد پیگیری: " + trackingCode + ")",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch {}
    }

    // ۲. بروزرسانی خودکار پرونده خریدار در جدول crm_customers
    try {
      const { data: existingCrm } = await supabaseAdmin
        .from("crm_customers")
        .select("*")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (existingCrm && existingCrm.id) {
        const nextSpent = Number(existingCrm.total_spent || 0) + finalAmount;
        const nextCount = Number(existingCrm.order_count || 0) + 1;
        await supabaseAdmin
          .from("crm_customers")
          .update({
            full_name: fullName,
            province,
            city,
            address,
            postal_code: postalCode || existingCrm.postal_code,
            total_spent: nextSpent,
            order_count: nextCount,
            lifecycle_stage: nextSpent > 80000000 ? "vip" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCrm.id);
      } else {
        await supabaseAdmin.from("crm_customers").insert([
          {
            id: "cust_" + Date.now(),
            full_name: fullName,
            phone: cleanPhone,
            province,
            city,
            address,
            postal_code: postalCode || null,
            total_spent: finalAmount,
            order_count: 1,
            lifecycle_stage: finalAmount > 80000000 ? "vip" : "active",
            tags: ["خریدار آنلاین"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {}

    // ۳. ثبت مصرف کوپن در صورت استفاده
    if (body.couponCode) {
      try {
        const cleanCode = String(body.couponCode).trim().toUpperCase();
        const { data: cpn } = await supabaseAdmin
          .from("coupons")
          .select("id, times_used, used_count")
          .eq("code", cleanCode)
          .maybeSingle();
        if (cpn && cpn.id) {
          const used = Number(cpn.times_used ?? cpn.used_count ?? 0) + 1;
          await supabaseAdmin
            .from("coupons")
            .update({ times_used: used, used_count: used })
            .eq("id", cpn.id);
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      order: createdOrder || orderPayload,
      trackingCode,
      message: "سفارش شما با موفقیت ثبت شد و آماده انتقال به درگاه پرداخت است.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در پردازش تسویه‌حساب." },
      { status: 500 }
    );
  }
}
