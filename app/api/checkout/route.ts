// File Path: app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyPhoneTokenSignature } from "@/app/api/send-otp/route";
import { verifyCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const fullName = String(customer.fullName || body.customer_name || "خریدار محترم").trim();
    const cleanPhone = String(customer.phone || body.phone || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");
    const province = String(customer.province || body.province || "تهران").trim();
    const city = String(customer.city || body.city || "تهران").trim();
    const address = String(customer.address || body.address || "").trim();
    const postalCode = String(customer.postalCode || body.postal_code || "").replace(/\D/g, "");
    const notes = String(customer.notes || body.notes || "").trim();

    if (!cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل ۱۱ رقمی معتبر الزامی است." },
        { status: 400 }
      );
    }

    const otpTokenFromBody = String(body.otpVerificationToken || "").trim();
    const otpTokenFromCookie = req.cookies.get("axon_verified_phone_token")?.value || "";
    const customerSessionCookie = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value || "";

    let isPhoneCryptographicallyVerified =
      verifyPhoneTokenSignature(cleanPhone, otpTokenFromBody) ||
      verifyPhoneTokenSignature(cleanPhone, otpTokenFromCookie);

    if (!isPhoneCryptographicallyVerified && customerSessionCookie) {
      const custSession = await verifyCustomerToken(customerSessionCookie);
      if (custSession && String(custSession.phone).replace(/\D/g, "") === cleanPhone) {
        isPhoneCryptographicallyVerified = true;
      }
    }

    if (!isPhoneCryptographicallyVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "خطای امنیتی: شماره تلفن همراه شما هنوز از طریق کد پیامکی تایید نشده است.",
        },
        { status: 403 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: "سبد خرید شما خالی است." },
        { status: 400 }
      );
    }

    const subtotal = Number(
      body.subtotal ||
        body.total_amount ||
        items.reduce(
          (sum: number, i: any) =>
            sum + Number(i.discountPrice || i.discount_price || i.price || 0) * Number(i.quantity || 1),
          0
        )
    );
    const discountAmount = Number(body.discountAmount || body.discount_amount || 0);
    const shippingCost = Number(body.shippingCost || body.shipping_fee || 0);
    const finalAmount = Math.max(
      0,
      Number(body.finalAmount || body.final_amount || subtotal - discountAmount + shippingCost)
    );

    const shortCode = Math.floor(100000 + Math.random() * 900000).toString();
    const orderNumber = "AXN-" + shortCode;
    const trackingCode = "TRK-" + Date.now().toString().slice(-6) + "-" + shortCode.slice(0, 3);
    const fullAddress = province + "، " + city + " — " + address + (notes ? " (" + notes + ")" : "");

    const orderPayload: Record<string, any> = {
      id: orderNumber,
      order_number: orderNumber,
      customer_name: fullName,
      phone: cleanPhone,
      province,
      city,
      address: fullAddress,
      postal_code: postalCode || null,
      items,
      total_amount: subtotal,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      coupon_code: body.couponCode || null,
      status: "pending",
      payment_status: "pending",
      tracking_code: trackingCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let savedOrder: any = orderPayload;
    const { data: insertedOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert([orderPayload])
      .select()
      .maybeSingle();

    if (!orderErr && insertedOrder) {
      savedOrder = insertedOrder;
    } else {
      const minimalOrder: Record<string, any> = {
        id: randomUUID(),
        customer_name: fullName,
        phone: cleanPhone,
        address: fullAddress,
        items,
        total_amount: subtotal,
        final_amount: finalAmount,
        status: "pending",
        tracking_code: trackingCode,
        created_at: new Date().toISOString(),
      };
      const { data: minInserted } = await supabaseAdmin
        .from("orders")
        .insert([minimalOrder])
        .select()
        .maybeSingle();
      if (minInserted) savedOrder = minInserted;
    }

    for (const item of items) {
      const prodId = String(item.id || item.productId || item.product_id || "");
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!prodId) continue;

      try {
        const { data: prodRow } = await supabaseAdmin
          .from("products")
          .select("id, title, name, stock, price, purchase_price")
          .eq("id", prodId)
          .maybeSingle();

        if (prodRow) {
          const currentStock = Number(prodRow.stock ?? 10);
          const nextStock = Math.max(0, currentStock - qty);
          await supabaseAdmin
            .from("products")
            .update({
              stock: nextStock,
              is_available: nextStock > 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", prodRow.id);

          await supabaseAdmin.from("inventory_logs").insert([
            {
              id: "sale_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
              product_id: String(prodRow.id),
              product_title: prodRow.title || prodRow.name || item.title,
              change_type: "sale",
              quantity: qty,
              cost_price: Number(
                prodRow.purchase_price || Math.round(Number(prodRow.price || 0) * 0.7)
              ),
              supplier: "فروش آنلاین سایت",
              reference_note: "کسر خودکار بابت فاکتور " + (savedOrder.order_number || savedOrder.id),
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch {}
    }

    try {
      await supabaseAdmin.from("crm_customers").upsert([
        {
          id: "cust_" + cleanPhone,
          full_name: fullName,
          phone: cleanPhone,
          province,
          city,
          address: fullAddress,
          postal_code: postalCode || null,
          lifecycle_stage: "active",
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      order: {
        ...savedOrder,
        tracking_code: savedOrder.tracking_code || trackingCode,
      },
      message: "✓ سفارش ثبت شد و در حال انتقال به درگاه پرداخت است.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت سفارش." },
      { status: 500 }
    );
  }
}
