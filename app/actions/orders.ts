// File Path: app/actions/orders.ts
"use server";

import { supabaseAdmin } from "@/lib/supabaseServer";

export interface OrderItemInput {
  productId: string;
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
      return { success: false, error: "مشخصات گیرنده و آدرس تحویل ناقص است." };
    }

    // ۱. استعلام قیمت‌ها و موجودی مستقیم از دیتابیس جهت جلوگیری از تقلب در قیمت کلاینت
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, price, discount_price, stock")
      .in("id", productIds);

    let calculatedTotal = 0;
    const validatedItems = items.map((item) => {
      const dbProduct = dbProducts?.find((p) => String(p.id) === String(item.productId));
      const unitPrice = dbProduct
        ? (dbProduct.discount_price && dbProduct.discount_price > 0 ? Number(dbProduct.discount_price) : Number(dbProduct.price))
        : Number(item.price);

      calculatedTotal += unitPrice * Number(item.quantity || 1);
      return {
        ...item,
        price: unitPrice,
      };
    });

    // ۲. اعتبارسنجی سروری کوپن تخفیف
    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const isPercent = coupon.type === "percent" || coupon.discount_type === "percent" || Boolean(coupon.discount_percent);
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
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // ۳. ثبت فاکتور رسمی در جدول orders
    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        id: orderId,
        order_number: orderId,
        customer_name: customer.fullName.trim(),
        phone: customer.phone.trim(),
        province: customer.province || "",
        city: customer.city || "",
        address: customer.address.trim(),
        postal_code: customer.postalCode.trim(),
        notes: customer.notes || "",
        items: validatedItems,
        total_amount: calculatedTotal,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: couponCode || null,
        payment_status: "pending",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newOrder) {
      console.error("Order server creation error:", insertError);
      return { success: false, error: "خطا در ثبت فاکتور در دیتابیس." };
    }

    // ۴. کسر خودکار موجودی انبار برای کالاهای خریداری‌شده
    for (const item of validatedItems) {
      if (item.productId) {
        try {
          const { data: p } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", item.productId)
            .maybeSingle();

          if (p && p.stock !== null && p.stock !== undefined) {
            const nextStock = Math.max(0, Number(p.stock) - Number(item.quantity || 1));
            await supabaseAdmin
              .from("products")
              .update({ stock: nextStock, is_available: nextStock > 0 })
              .eq("id", item.productId);
          }
        } catch (stkErr) {
          console.warn("Stock decrease warning:", stkErr);
        }
      }
    }

    return {
      success: true,
      orderId: newOrder.id,
      totalAmount: finalPayable,
    };
  } catch (err: any) {
    console.error("Server Action Create Order Error:", err);
    return { success: false, error: err.message || "خطای غیرمنتظره در پردازش فاکتور." };
  }
}

export async function updateOrderStatusServer(orderId: string, status: string, paymentStatus?: string) {
  try {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}