import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { smsService } from '@/services/smsService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || `ORD-${Date.now().toString().slice(-6)}`;

    const customerName = (body.customerName || body.customer_name || 'مشتری').trim();
    const phone = (body.phone || '').trim();
    const address = (body.address || '').trim();
    const postalCode = body.postalCode || body.postal_code || null;
    const items = Array.isArray(body.items) ? body.items : [];
    const totalAmount = Number(body.totalAmount || body.total_amount || 0);
    const discountAmount = Number(body.discountAmount || body.discount_amount || 0);
    const couponCode = body.couponCode || body.coupon_code || null;
    const status = body.status || 'processing';

    const orderPayload = {
      id: orderId,
      customer_name: customerName,
      phone,
      address,
      postal_code: postalCode,
      items,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      coupon_code: couponCode,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // ۱. ذخیره در Supabase
    const { data, error } = await supabaseAdmin
      .from('orders')
      .upsert(orderPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase DB Error in orders:', error);
      return NextResponse.json({ success: false, message: error.message, details: error }, { status: 400 });
    }

    // ۲. کسر موجودی فیزیکی
    if (items.length > 0) {
      for (const itm of items) {
        const pId = itm.productId || itm.id;
        if (pId) {
          try {
            const { data: pData } = await supabaseAdmin
              .from('products')
              .select('stock')
              .eq('id', pId)
              .maybeSingle();

            if (pData && pData.stock !== null && pData.stock !== undefined) {
              const curStock = Number(pData.stock);
              const nextStock = Math.max(0, curStock - Number(itm.quantity || 1));
              await supabaseAdmin
                .from('products')
                .update({ stock: nextStock, is_available: nextStock > 0 })
                .eq('id', pId);
            }
          } catch (stkErr) {
            console.error('Stock decrement error:', stkErr);
          }
        }
      }
    }

    // ۳. ارسال پیامک
    if (phone) {
      try {
        await smsService.sendOrderStatusChange(phone, orderId, 'در حال پردازش و انبارداری');
      } catch (smsErr) {
        console.error('SMS sending error:', smsErr);
      }
    }

    return NextResponse.json({ success: true, data: data || orderPayload });
  } catch (err: any) {
    console.error('Fatal API Error /api/orders:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'خطای غیرمنتظره در سرور', stack: err?.stack },
      { status: 500 }
    );
  }
}