// File Path: app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyPhoneTokenSignature } from "@/app/api/send-otp/route";
import { verifyCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { sendTextSMS } from "@/lib/otpService";
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
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");
    const province = String(customer.province || body.province || "تهران").trim();
    const city = String(customer.city || body.city || "تهران").trim();
    const address = String(customer.address || body.address || "").trim();
    const postalCode = String(customer.postalCode || body.postal_code || "").replace(/\D/g, "");
    const notes = String(customer.notes || body.notes || "").trim();

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل ۱۱ رقمی معتبر الزامی است." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: "سبد خرید شما خالی است." },
        { status: 400 }
      );
    }

    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("homepage_layout_config")
      .limit(1)
      .maybeSingle();

    const sysRules = normalizeSystemSettings(siteRow?.homepage_layout_config);

    const otpTokenFromBody = String(body.otpVerificationToken || "").trim();
    const otpTokenFromCookie = req.cookies.get("axon_verified_phone_token")?.value || "";
    const customerSessionCookie = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value || "";

    let isCustomerLoggedIn = false;
    if (customerSessionCookie) {
      const custSession = await verifyCustomerToken(customerSessionCookie);
      if (custSession && String(custSession.phone).replace(/\D/g, "") === cleanPhone) {
        isCustomerLoggedIn = true;
      }
    }

    if (!sysRules.allowGuestCheckout && !isCustomerLoggedIn) {
      return NextResponse.json(
        {
          success: false,
          message: "ثبت سفارش مهمان در حال حاضر غیرفعال است. لطفاً ابتدا وارد حساب کاربری خود شوید.",
        },
        { status: 403 }
      );
    }

    const isPhoneCryptographicallyVerified =
      isCustomerLoggedIn ||
      verifyPhoneTokenSignature(cleanPhone, otpTokenFromBody) ||
      verifyPhoneTokenSignature(cleanPhone, otpTokenFromCookie);

    if (!isPhoneCryptographicallyVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن همراه شما هنوز از طریق کد پیامکی تایید نشده است.",
        },
        { status: 403 }
      );
    }

    let verifiedSubtotal = 0;
    const verifiedItems: any[] = [];

    for (const item of items) {
      const prodId = String(item.id || item.productId || item.product_id || "");
      const qty = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      let unitPrice = Number(item.discountPrice ?? item.discount_price ?? item.price ?? 0);

      if (prodId) {
        const { data: dbProd } = await supabaseAdmin
          .from("products")
          .select("id, title, name, price, discount_price, stock, is_available")
          .eq("id", prodId)
          .maybeSingle();

        if (dbProd) {
          const dbDiscount = Number(dbProd.discount_price || 0);
          const dbRegular = Number(dbProd.price || 0);
          unitPrice = dbDiscount > 0 && dbDiscount < dbRegular ? dbDiscount : dbRegular;
        }
      }

      verifiedSubtotal += unitPrice * qty;
      verifiedItems.push({
        ...item,
        quantity: qty,
        price: unitPrice,
      });
    }

    let verifiedDiscount = 0;
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : null;
    if (couponCode) {
      const { data: couponRow } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .ilike("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      if (couponRow) {
        const dtype = String(couponRow.discount_type || "percent");
        const dval = Number(couponRow.discount_value || 0);
        if (dtype === "percent") {
          verifiedDiscount = Math.round((verifiedSubtotal * dval) / 100);
        } else {
          verifiedDiscount = Math.min(verifiedSubtotal, dval);
        }
      } else {
        verifiedDiscount = Math.min(
          verifiedSubtotal,
          Math.max(0, Number(body.discountAmount ?? 0))
        );
      }
    }

    const afterDiscount = Math.max(0, verifiedSubtotal - verifiedDiscount);

    const shippingCost =
      afterDiscount <= 0
        ? 0
        : sysRules.defaultShippingCost <= 0
        ? 0
        : sysRules.freeShippingThreshold > 0 && afterDiscount >= sysRules.freeShippingThreshold
        ? 0
        : sysRules.defaultShippingCost;

    const vatPercent = sysRules.vatPercent;
    const vatAmount =
      afterDiscount > 0 && vatPercent > 0
        ? Math.round((afterDiscount * vatPercent) / 100)
        : 0;

    const finalAmount = Math.max(0, afterDiscount + vatAmount + shippingCost);

    const shortCode = Math.floor(100000 + Math.random() * 900000).toString();
    const orderNumber = "AXN-" + shortCode;
    const trackingCode = "TRK-" + Date.now().toString().slice(-6) + "-" + shortCode.slice(0, 3);
    const fullAddress =
      province +
      "، " +
      city +
      " — " +
      address +
      (notes ? " (" + notes + ")" : "");

    const generatedUuid = randomUUID();
    const orderPayload: Record<string, any> = {
      id: generatedUuid,
      order_number: orderNumber,
      customer_name: fullName,
      phone: cleanPhone,
      province,
      city,
      address: fullAddress,
      postal_code: postalCode || null,
      items: verifiedItems,
      total_amount: verifiedSubtotal,
      discount_amount: verifiedDiscount,
      final_amount: finalAmount,
      coupon_code: couponCode,
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
        items: verifiedItems,
        total_amount: verifiedSubtotal,
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

    for (const item of verifiedItems) {
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
              reference_note:
                "کسر خودکار بابت فاکتور " + (savedOrder.order_number || savedOrder.id),
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

    if (sysRules.autoSendOrderSms) {
      sendTextSMS(cleanPhone, shortCode).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      order: {
        ...savedOrder,
        subtotal: verifiedSubtotal,
        discount_amount: verifiedDiscount,
        vat_percent: vatPercent,
        vat_amount: vatAmount,
        shipping_cost: shippingCost,
        final_amount: finalAmount,
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
