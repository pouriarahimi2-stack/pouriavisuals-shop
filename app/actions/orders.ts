// app/actions/orders.ts
'use server';

import { supabaseAdmin } from '@/lib/supabaseServer';

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
      return { success: false, error: 'سبد خرید خالی است.' };
    }

    if (!customer.phone || !customer.address || !customer.postalCode) {
      return { success: false, error: 'اطلاعات گیرنده و آدرس ناقص است.' };
    }

    // استعلام و بررسی قیمت‌ها از دیتابیس برای جلوگیری از دستکاری قیمت در کلاینت
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const { data: dbProducts } = await supabaseAdmin
      .from('products')
      .select('id, price, discount_price, stock')
      .in('id', productIds);

    let calculatedTotal = 0;
    const validatedItems = items.map((item) => {
      const dbProduct = dbProducts?.find((p) => p.id === item.productId);
      const unitPrice = dbProduct
        ? (dbProduct.discount_price && dbProduct.discount_price > 0 ? dbProduct.discount_price : dbProduct.price)
        : item.price;

      calculatedTotal += unitPrice * item.quantity;
      return {
        ...item,
        price: unitPrice,
      };
    });

    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (coupon) {
        if (coupon.discount_percent || coupon.value) {
          const val = coupon.discount_percent || coupon.value;
          discountAmount = Math.round((calculatedTotal * val) / 100);
          if (coupon.max_discount && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
          }
        }
      }
    }

    const finalPayable = Math.max(0, calculatedTotal - discountAmount + shippingCost);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        order_number: orderId,
        customer_name: customer.fullName,
        phone: customer.phone,
        province: customer.province || '',
        city: customer.city || '',
        address: customer.address,
        postal_code: customer.postalCode,
        notes: customer.notes || '',
        items: validatedItems,
        total_amount: calculatedTotal,
        discount_amount: discountAmount,
        final_amount: finalPayable,
        coupon_code: couponCode || null,
        payment_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newOrder) {
      return { success: false, error: 'خطا در ثبت اطلاعات سفارش در سرور دیتابیس.' };
    }

    return {
      success: true,
      orderId: newOrder.id,
      totalAmount: finalPayable,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای غیرمنتظره در ثبت سفارش.' };
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
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}