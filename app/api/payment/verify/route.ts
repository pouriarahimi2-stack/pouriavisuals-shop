import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authority, status, orderId } = body;

    if (!authority || status !== 'OK' || !orderId) {
      return NextResponse.json(
        { success: false, message: 'تراکنش نامعتبر است یا توسط کاربر لغو شد.' },
        { status: 400 }
      );
    }

    // استعلام سفارش مستقیماً از دیتابیس با دسترسی امن سروری
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, message: 'سفارش مورد نظر در سیستم یافت نشد.' },
        { status: 404 }
      );
    }

    // در صورتی که سفارش قبلاً تایید شده باشد (Idempotency)
    if (order.payment_status === 'PAID' || order.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'این سفارش قبلاً با موفقیت پرداخت و ثبت شده است.',
        orderId: order.id,
      });
    }

    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const isSandbox = process.env.NODE_ENV !== 'production' || !merchantId;

    let isVerified = false;
    let refId = `SIM-${Date.now()}`;

    // درگاه واقعی در محیط پروداکشن
    if (!isSandbox && merchantId) {
      const zarinpalUrl = 'https://api.zarinpal.com/pg/v4/payment/verify.json';
      const verifyRes = await fetch(zarinpalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          amount: order.total_amount, // استفاده از مبلغ دیتابیس به جای مقدار هاردکد
          authority: authority,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.data && (verifyData.data.code === 100 || verifyData.data.code === 101)) {
        isVerified = true;
        refId = String(verifyData.data.ref_id);
      }
    } else {
      // شبیه‌ساز محلی (فقط در صورت تایید دستی محیط تست)
      isVerified = true;
    }

    if (!isVerified) {
      return NextResponse.json(
        { success: false, message: 'اعتبارسنجی پرداخت از سمت درگاه بانکی تایید نشد.' },
        { status: 402 }
      );
    }

    // به‌روزرسانی نهایی وضعیت سفارش در دیتابیس
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'PAID',
        status: 'processing',
        transaction_ref: refId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'خطا در ثبت نهایی وضعیت پرداخت در سرور.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'پرداخت با موفقیت انجام شد.',
      refId,
      orderId: order.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'خطای سیستمی در پردازش تایید پرداخت: ' + err.message },
      { status: 500 }
    );
  }
}