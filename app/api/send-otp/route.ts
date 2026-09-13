import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OTP_HMAC_SECRET } from '@/lib/authSecurityHelper';
import { sendSMS } from '@/services/smsService';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { phone, code, token, action } = await req.json();
    const cleanPhone = String(phone || '').trim().replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      return NextResponse.json({ success: false, message: 'شماره تلفن همراه معتبر ۱۱ رقمی الزامی است.' }, { status: 400 });
    }

    if (action === 'send') {
      // بررسی محدودیت ارسال در پنجره زمانی ۵ دقیقه‌ای
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      const { count } = await supabaseAdmin
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('phone', cleanPhone)
        .gte('created_at', fiveMinutesAgo);

      if (count && count > 5) {
        return NextResponse.json(
          { success: false, message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً ۵ دقیقه بعد تلاش نمایید.' },
          { status: 429 }
        );
      }

      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(now.getTime() + 180 * 1000).toISOString(); // اعتبار ۳ دقیقه

      const hmac = crypto.createHmac('sha256', OTP_HMAC_SECRET);
      hmac.update(`${cleanPhone}:${generatedCode}:${expiresAt}`);
      const signature = hmac.digest('hex');

      await sendSMS(cleanPhone, `کد تایید ورود شما به آکسون: ${generatedCode}`);

      return NextResponse.json({
        success: true,
        message: 'کد تایید ارسال گردید.',
        token: `${expiresAt}:${signature}`,
      });
    }

    if (action === 'verify') {
      const cleanCode = String(code || '').trim();
      const receivedToken = String(token || '').trim();

      if (!cleanCode || !receivedToken || !receivedToken.includes(':')) {
        return NextResponse.json({ success: false, verified: false, message: 'کد تایید یا توکن نشست نامعتبر است.' }, { status: 400 });
      }

      const [expiresAtStr, receivedSignature] = receivedToken.split(':');
      const nowTime = new Date().getTime();
      const expiryTime = new Date(expiresAtStr).getTime();

      if (isNaN(expiryTime) || nowTime > expiryTime) {
        return NextResponse.json({ success: false, verified: false, message: 'کد تایید منقضی شده است. مجدداً درخواست کد دهید.' }, { status: 400 });
      }

      // بازسازی امضا سمت سرور و مقایسه زمان‌ثابت برای خنثی‌سازی Timing Attack
      const hmac = crypto.createHmac('sha256', OTP_HMAC_SECRET);
      hmac.update(`${cleanPhone}:${cleanCode}:${expiresAtStr}`);
      const expectedSignature = hmac.digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');

      if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        return NextResponse.json({ success: false, verified: false, message: 'کد تایید وارد شده نادرست است.' }, { status: 400 });
      }

      return NextResponse.json({ success: true, verified: true, message: 'احراز هویت با موفقیت انجام شد.' });
    }

    return NextResponse.json({ success: false, message: 'عملیات نامعتبر است.' }, { status: 400 });
  } catch (err: any) {
    console.error('[OTP_API_ERROR]:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
