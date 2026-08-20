import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/services/smsService';
import { supabaseAdmin } from '@/lib/supabaseServer';

const memoryRateLimit = new Map<string, { count: number; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, message: 'شماره تماس الزامی است.' }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/^(\+98|0098|98)/, '0');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: 'شماره موبایل وارد شده صحیح نیست.' }, { status: 422 });
    }

    // محدودیت ارسال (حداکثر ۳ تلاش در ۳ دقیقه)
    const now = Date.now();
    const rate = memoryRateLimit.get(cleanPhone);
    if (rate && now < rate.expires && rate.count >= 3) {
      return NextResponse.json(
        { success: false, message: 'درخواست‌های بیش از حد. لطفاً ۳ دقیقه دیگر مجدداً تلاش کنید.' },
        { status: 429 }
      );
    }

    const generatedOtp = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    // ذخیره در جدول کدهای تایید در سرور (یا بازگشت پایدار)
    await supabaseAdmin
      .from('otps')
      .upsert({ phone: cleanPhone, code: generatedOtp, expires_at: expiresAt }, { onConflict: 'phone' })
      .select()
      .maybeSingle();

    // بروزرسانی شمارنده ریت لیمیت
    memoryRateLimit.set(cleanPhone, {
      count: (rate?.count || 0) + 1,
      expires: rate?.expires && now < rate.expires ? rate.expires : now + 3 * 60 * 1000,
    });

    // ارسال پیامک
    await sendSMS(cleanPhone, `کد ورود شما به فروشگاه: ${generatedOtp}`);

    return NextResponse.json({
      success: true,
      message: 'کد تایید پیامک شد.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'خطا در برقراری ارتباط با سرور پیامک.' }, { status: 500 });
  }
}