"use server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import crypto from "crypto";

export interface OrderItemInput {
  productId: string | number;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  customer: {
    fullName: string;
    phone: string;
    province?: string;
    city?: string;
    address: string;
    postalCode?: string;
    notes?: string;
  };
  couponCode?: string;
  shippingCost?: number;
}

export async function createOrderServer(payload: CreateOrderInput) {
  try {
    const { items, customer, couponCode, shippingCost = 0 } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "سبد خرید خالی است." };
    }

    if (!customer.phone || !customer.address || !customer.fullName) {
      return { success: false, error: "مشخصات خریدار و نشانی تحویل مرسوله ناقص است." };
    }

    const cleanPhone = customer.phone
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return { success: false, error: "شماره تماس وارد شده معتبر نیست (باید ۱۱ رقم و با ۰۹ آغاز شود)." };
    }

    const productIds = items.map((i) => String(i.productId)).filter(Boolean);
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available")
      .in("id", productIds);

    if (dbErr || !dbProducts) {
      return { success: false, error: "خطا در استعلام اطلاعات محصولات از پایگاه داده مرکزی." };
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    // اعتبارسنجی قیمت واقعی دیتابیس و موجودی انبار
    for (const item of items) {
      const dbProduct = dbProducts.find((p: any) => String(p.id) === String(item.productId));

      if (!dbProduct) {
        return {
          success: false,
          error: `کالای «${item.title || item.productId}» در سیستم یافت نشد.`,
        };
      }

      const reqQty = Math.max(1, Number(item.quantity || 1));
      const currentStock = dbProduct.stock !== null && dbProduct.stock !== undefined ? Number(dbProduct.stock) : 0;

      if (dbProduct.is_available === false || currentStock < reqQty) {
        return {
          success: false,
          error: `موجودی کالای «${dbProduct.title}» کافی نیست (موجودی فعلی: ${currentStock} عدد).`,
        };
      }

      const unitPrice =
        dbProduct.discount_price && Number(dbProduct.discount_price) > 0
          ? Number(dbProduct.discount_price)
          : Number(dbProduct.price);

      calculatedTotal += unitPrice * reqQty;

      validatedItems.push({
        productId: String(dbProduct.id),
        title: dbProduct.title,
        price: unitPrice,
        quantity: reqQty,
        image: item.image || "",
      });
    }

    // محاسبه امن کد تخفیف در سمت سرور
    let discountAmount = 0;
    let validCouponRecord: any = null;

    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", cleanCode)
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now();
        const usageLimitReached =
          typeof coupon.usage_limit === "number" &&
          coupon.usage_limit > 0 &&
          (coupon.times_used || coupon.used_count || 0) >= coupon.usage_limit;

        const minSpend = Number(coupon.min_purchase || coupon.min_order_amount || 0);

        if (!isExpired && !usageLimitReached && (minSpend <= 0 || calculatedTotal >= minSpend)) {
          validCouponRecord = coupon;
          const isPercent =
            coupon.type === "percent" ||
            coupon.discount_type === "percent" ||
            Boolean(coupon.discount_percent);
          const val = Number(coupon.value || coupon.discount_value || coupon.discount_percent || 0);

          if (isPercent) {
            discountAmount = Math.round((calculatedTotal * val) / 100);
            const maxLimit = Number(coupon.max_discount || coupon.max_discount_amount || 0);
            if (maxLimit > 0 && discountAmount > maxLimit) {
              discountAmount = maxLimit;
            }
          } else {
            discountAmount = val;
          }
        }
      }
    }

    discountAmount = Math.min(discountAmount, calculatedTotal);
    const finalPayable = Math.max(0, calculatedTotal - discountAmount + shippingCost);
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        id: orderId,
        order_number: orderId,
        customer_name: customer.fullName.trim(),
        phone: cleanPhone,
        province: customer.province || "تهران",
        city: customer.city || "تهران",
        address: customer.address.trim(),
        postal_code: customer.postalCode?.trim() || null,
        notes: customer.notes || "",
        items: validatedItems,
        total_amount: calculatedTotal,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: validCouponRecord ? validCouponRecord.code : null,
        payment_status: "pending",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newOrder) {
      return { success: false, error: "خطا در ثبت سفارش در پایگاه داده." };
    }

    // کسر اتمیک و امن موجودی انبار با جلوگیری از Race Condition
    for (const it of validatedItems) {
      try {
        const { data: currentP } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.productId)
          .single();

        if (currentP && currentP.stock !== null && currentP.stock !== undefined) {
          const nextStock = Math.max(0, Number(currentP.stock) - Number(it.quantity));
          await supabaseAdmin
            .from("products")
            .update({ stock: nextStock, is_available: nextStock > 0 })
            .eq("id", it.productId);
        }
      } catch (stkErr) {
        console.warn("Atomic stock decrement warn:", stkErr);
      }
    }

    // ثبت استفاده از کوپن
    if (validCouponRecord) {
      try {
        const nextUsed = (validCouponRecord.times_used || validCouponRecord.used_count || 0) + 1;
        await supabaseAdmin
          .from("coupons")
          .update({ times_used: nextUsed, used_count: nextUsed })
          .eq("id", validCouponRecord.id);
      } catch (cpnErr) {
        console.warn("Coupon update warn:", cpnErr);
      }
    }

    return {
      success: true,
      orderId: newOrder.id,
      totalAmount: finalPayable,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "خطای پردازش فاکتور." };
  }
}
