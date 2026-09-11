import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OTP_HMAC_SECRET } from '@/lib/authSecurityHelper';
import { sendSMS } from '@/services/smsService';

export const dynamic = 'force-dynamic';

const otpStore = new Map<string, { hash: string; expiresAt: number; attempts: number }>();
const ipLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(key: string, limit = 3, windowMs = 120000): boolean {
  const now = Date.now();
  const entry = ipLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    ipLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, action } = body;
    const clientIp = req.headers.get('x-forwarded-for') || 'caller';

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      return NextResponse.json({ success: false, message: 'شماره موبایل وارد شده معتبر نیست.' }, { status: 400 });
    }

    if (action === 'verify') {
      const entry = otpStore.get(cleanPhone);
      if (!entry) {
        return NextResponse.json({ success: false, message: 'کد تایید منقضی شده یا درخواست نشده است.' }, { status: 400 });
      }

      if (Date.now() > entry.expiresAt) {
        otpStore.delete(cleanPhone);
        return NextResponse.json({ success: false, message: 'کد تایید منقضی شده است. مجدداً درخواست دهید.' }, { status: 400 });
      }

      if (entry.attempts >= 5) {
        otpStore.delete(cleanPhone);
        return NextResponse.json({ success: false, message: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است.' }, { status: 429 });
      }

      const inputHash = crypto.createHmac('sha256', OTP_HMAC_SECRET).update(`${cleanPhone}:${code}`).digest('hex');

      if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(entry.hash))) {
        otpStore.delete(cleanPhone);
        const userToken = 'USER-' + crypto.randomBytes(16).toString('hex');
        return NextResponse.json({
          success: true,
          verified: true,
          token: userToken,
          message: 'شماره همراه با موفقیت تایید گردید.',
        });
      } else {
        entry.attempts++;
        return NextResponse.json({ success: false, message: 'کد تایید وارد شده نادرست است.' }, { status: 400 });
      }
    }

    // ارسال کد OTP
    if (isRateLimited(`${clientIp}:${cleanPhone}`)) {
      return NextResponse.json({ success: false, message: 'درخواست بیش از حد. لطفاً ۲ دقیقه دیگر تلاش کنید.' }, { status: 429 });
    }

    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    const codeHash = crypto.createHmac('sha256', OTP_HMAC_SECRET).update(`${cleanPhone}:${generatedCode}`).digest('hex');

    otpStore.set(cleanPhone, {
      hash: codeHash,
      expiresAt: Date.now() + 180000, // ۳ دقیقه
      attempts: 0,
    });

    await sendSMS(cleanPhone, `کد تایید ورود به آکسون: ${generatedCode}`);

    return NextResponse.json({
      success: true,
      message: 'کد تایید به شماره شما ارسال گردید.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'خطای سیستمی در ارسال کد تایید.' }, { status: 500 });
  }
}
