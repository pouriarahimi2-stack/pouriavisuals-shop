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
    postalCode: string;
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
      .replace(/\D/g, "");

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return { success: false, error: "شماره تماس وارد شده معتبر نیست." };
    }

    const productIds = items.map((i) => String(i.productId)).filter(Boolean);
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
      .from("products")
      .select("id, title, price, discount_price, stock, is_available")
      .in("id", productIds);

    if (dbErr || !dbProducts) {
      return { success: false, error: "خطا در استعلام اطلاعات محصولات از دیتابیس." };
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = dbProducts.find((p: any) => String(p.id) === String(item.productId));

      // بستن قطعی رخنه جعل قیمت: اگر کالایی در دیتابیس نباشد، سفارش فوراً رد می‌شود
      if (!dbProduct) {
        return {
          success: false,
          error: `کالای «${item.title || item.productId}» در سیستم یافت نشد یا معتبر نیست.`,
        };
      }

      if (dbProduct.stock !== null && dbProduct.stock !== undefined && dbProduct.stock < (item.quantity || 1)) {
        return {
          success: false,
          error: `موجودی کالای «${dbProduct.title}» در انبار برای این تعداد کافی نیست.`,
        };
      }

      const unitPrice =
        dbProduct.discount_price && Number(dbProduct.discount_price) > 0
          ? Number(dbProduct.discount_price)
          : Number(dbProduct.price);

      calculatedTotal += unitPrice * Number(item.quantity || 1);

      validatedItems.push({
        productId: String(dbProduct.id),
        title: dbProduct.title,
        price: unitPrice,
        quantity: Number(item.quantity || 1),
        image: item.image || "",
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
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

    const finalPayable = Math.max(0, calculatedTotal - discountAmount + shippingCost);
    // ساخت شناسه یکتا و بدون تصادم
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
        postal_code: customer.postalCode.trim(),
        notes: customer.notes || "",
        items: validatedItems,
        total_amount: calculatedTotal,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
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

    // کسر موجودی انبار
    for (const it of validatedItems) {
      try {
        const { data: p } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.productId)
          .single();

        if (p && p.stock !== null && p.stock !== undefined) {
          const nextStock = Math.max(0, Number(p.stock) - Number(it.quantity));
          await supabaseAdmin
            .from("products")
            .update({ stock: nextStock, is_available: nextStock > 0 })
            .eq("id", it.productId);
        }
      } catch (stkErr) {
        console.warn("Stock decrease err:", stkErr);
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
