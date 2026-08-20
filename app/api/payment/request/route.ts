import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { orderId, callbackUrl } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'شناسه سفارش الزامی است.' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, phone')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, message: 'سفارش یافت نشد.' }, { status: 404 });
    }

    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const isSandbox = !merchantId || process.env.NODE_ENV !== 'production';

    if (!isSandbox && merchantId) {
      const zarinpalUrl = 'https://api.zarinpal.com/pg/v4/payment/request.json';
      const gatewayRes = await fetch(zarinpalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: order.total_amount,
          callback_url: callbackUrl || `${req.nextUrl.origin}/checkout/payment`,
          description: `پرداخت سفارش ${order.id}`,
          metadata: { mobile: order.phone },
        }),
      });

      const data = await gatewayRes.json();
      if (data.data && data.data.code === 100) {
        return NextResponse.json({
          success: true,
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
          authority: data.data.authority,
        });
      }
    }

    // حالت لوکال / شبیه‌ساز امن
    const mockAuthority = `AUTH_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return NextResponse.json({
      success: true,
      paymentUrl: `/checkout/payment?Authority=${mockAuthority}&Status=OK&orderId=${order.id}`,
      authority: mockAuthority,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}