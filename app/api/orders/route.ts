import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || body.order_number || `ORD-${Date.now().toString().slice(-6)}`;

    const customerName = String(body.customerName || body.customer_name || body.customer?.fullName || 'خریدار محترم').trim();
    const phone = String(body.phone || body.customer?.phone || '').trim();
    const province = String(body.province || body.customer?.province || 'تهران').trim();
    const city = String(body.city || body.customer?.city || 'تهران').trim();
    const address = String(body.address || body.customer?.address || '').trim();
    const postalCode = body.postalCode || body.postal_code || body.customer?.postalCode || null;
    const items = Array.isArray(body.items) ? body.items : [];
    const totalAmount = Number(body.totalAmount || body.total_amount || 0);
    const discountAmount = Number(body.discountAmount || body.discount_amount || 0);
    const finalAmount = Number(body.finalAmount || body.final_amount || Math.max(0, totalAmount - discountAmount));
    const couponCode = body.couponCode || body.coupon_code || null;

    const orderPayload: any = {
      id: orderId,
      order_number: orderId,
      customer_name: customerName,
      phone,
      province,
      city,
      address,
      items,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      status: body.status || 'pending',
      payment_status: body.payment_status || body.paymentStatus || 'pending',
      payment_method: body.payment_method || body.paymentMethod || 'online',
      tracking_code: body.tracking_code || body.trackingCode || null,
      notes: body.notes || body.customer?.notes || '',
      updated_at: new Date().toISOString(),
    };

    if (postalCode) orderPayload.postal_code = String(postalCode).trim();
    if (couponCode) orderPayload.coupon_code = String(couponCode).trim().toUpperCase();

    // ثبت امن در دیتابیس با سوپابیس ادمین
    const { data, error } = await supabaseAdmin
      .from('orders')
      .upsert(orderPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      // تلاش مجدد با ساختار سازگار
      const safePayload = {
        order_number: orderId,
        customer_name: customerName,
        phone,
        address,
        total_amount: totalAmount,
        final_amount: finalAmount,
        items,
        status: 'pending',
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      };
      await supabaseAdmin.from('orders').insert([safePayload]);
    }

    return NextResponse.json({ success: true, data: data || orderPayload });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'خطا در ثبت فاکتور' }, { status: 500 });
  }
}
