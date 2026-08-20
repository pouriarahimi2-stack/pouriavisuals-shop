import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { smsService } from '@/services/smsService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || `ORD-${Date.now().toString().slice(-6)}`;

    // فیلدهای دقیق و منطبق با جدول Supabase
    const orderPayload = {
      id: orderId,
      customer_name: (body.customerName || body.customer_name || 'مشتری').trim(),
      phone: (body.phone || '').trim(),
      address: (body.address || '').trim(),
      postal_code: body.postalCode || body.postal_code || null,
      items: body.items || [],
      total_amount: Number(body.totalAmount || body.total_amount || 0),
      discount_amount: Number(body.discountAmount || body.discount_amount || 0),
      coupon_code: body.couponCode || body.coupon_code || null,
      status: body.status || 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ۱. درج سفارش در جدول orders
    const { data, error } = await supabaseAdmin
      .from('orders')
      .upsert(orderPayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase orders table error:', error);
      throw new Error(error.message);
    }

    // ۲. کسر موجودی انبار
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        const prodId = item.productId || item.id;
        if (prodId) {
          try {
            const { data: prod } = await supabaseAdmin
              .from('products')
              .select('stock')
              .eq('id', prodId)
              .maybeSingle();

            if (prod && prod.stock !== null && prod.stock !== undefined) {
              const currentStock = Number(prod.stock);
              const newStock = Math.max(0, currentStock - Number(item.quantity || 1));
              await supabaseAdmin
                .from('products')
                .update({ stock: newStock, is_available: newStock > 0 })
                .eq('id', prodId);
            }
          } catch (e) {
            console.error('Stock decrement warning:', e);
          }
        }
      }
    }

    // ۳. ارسال پیامک تایید سفارش به خریدار
    if (orderPayload.phone) {
      try {
        await smsService.sendOrderStatusChange(orderPayload.phone, orderId, 'در حال پردازش و انبارداری');
      } catch (smsErr) {
        console.error('SMS sending warning:', smsErr);
      }
    }

    return NextResponse.json({ success: true, data: data || orderPayload });
  } catch (err: any) {
    console.error('API /api/orders error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'خطای داخلی در ثبت فاکتور سفارش' },
      { status: 500 }
    );
  }
}