import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { smsService } from '@/services/smsService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || `ORD-${Date.now().toString().slice(-6)}`;

    const orderPayload = {
      id: orderId,
      customer_name: body.customerName || body.customer_name || 'مشتری',
      customerName: body.customerName || body.customer_name || 'مشتری',
      phone: body.phone,
      address: body.address,
      postal_code: body.postalCode || body.postal_code || null,
      postalCode: body.postalCode || body.postal_code || null,
      items: body.items || [],
      total_amount: Number(body.totalAmount || body.total_amount || 0),
      totalAmount: Number(body.totalAmount || body.total_amount || 0),
      discount_amount: Number(body.discountAmount || body.discount_amount || 0),
      discountAmount: Number(body.discountAmount || body.discount_amount || 0),
      coupon_code: body.couponCode || body.coupon_code || null,
      couponCode: body.couponCode || body.coupon_code || null,
      status: body.status || 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ۱. ثبت در دیتابیس Supabase
    const { data, error } = await supabaseAdmin
      .from('orders')
      .upsert(orderPayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Database order insertion error:', error);
      throw error;
    }

    // ۲. کسر هوشمند موجودی انبار محصولات
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        const prodId = item.productId || item.id;
        if (prodId) {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock')
            .eq('id', prodId)
            .maybeSingle();

          if (prod) {
            const currentStock = Number(prod.stock || 0);
            const newStock = Math.max(0, currentStock - Number(item.quantity || 1));
            await supabaseAdmin
              .from('products')
              .update({ stock: newStock, is_available: newStock > 0 })
              .eq('id', prodId);
          }
        }
      }
    }

    // ۳. ارسال پیامک وضعیت سفارش
    if (body.phone) {
      smsService.sendOrderStatusChange(body.phone, orderId, 'در حال پردازش و انبارداری').catch(() => {});
    }

    return NextResponse.json({ success: true, data: data || orderPayload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'خطا در ثبت فاکتور سفارش' }, { status: 500 });
  }
}