// File Path: app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { smsService } from '@/services/smsService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || `ORD-${Date.now().toString().slice(-6)}`;

    const customerName = String(body.customerName || body.customer_name || 'مشتری گرامی').trim();
    const phone = String(body.phone || body.customer_phone || '').trim();
    const address = String(body.address || body.customer_address || '').trim();
    const postalCode = body.postalCode || body.postal_code || null;
    const items = Array.isArray(body.items) ? body.items : [];
    const totalAmount = Number(body.totalAmount || body.total_amount || 0);
    const discountAmount = Number(body.discountAmount || body.discount_amount || 0);
    const couponCode = body.couponCode || body.coupon_code || null;
    const status = body.status || 'processing';

    const orderPayload: any = {
      id: orderId,
      order_number: orderId,
      customer_name: customerName,
      phone,
      address,
      items,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: Math.max(0, totalAmount - discountAmount),
      status,
      updated_at: new Date().toISOString(),
    };

    if (postalCode) orderPayload.postal_code = String(postalCode).trim();
    if (couponCode) orderPayload.coupon_code = String(couponCode).trim();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .upsert(orderPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase DB Error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    if (items.length > 0) {
      for (const itm of items) {
        const pId = itm.productId || itm.id || itm.product_id;
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

    if (phone) {
      try {
        await smsService.sendOrderStatusChange(phone, orderId, 'در حال پردازش و بسته‌بندی');
      } catch (smsErr) {
        console.error('SMS warning:', smsErr);
      }
    }

    return NextResponse.json({ success: true, data: data || orderPayload });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'خطای غیرمنتظره در ثبت سفارش' },
      { status: 500 }
    );
  }
}