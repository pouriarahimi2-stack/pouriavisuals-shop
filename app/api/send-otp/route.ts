import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OTP_HMAC_SECRET } from '@/lib/authSecurityHelper';
import { sendSMS } from '@/services/smsService';

export const dynamic = 'force-dynamic';

interface OtpTracker {
  attempts: number;
  lockedUntil: number;
  lastSent: number;
}

const otpAttemptMap = new Map<string, OtpTracker>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanPhone = String(body.phone || '').trim().replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      return NextResponse.json({ success: false, message: 'شماره تلفن همراه معتبر ۱۱ رقمی الزامی است.' }, { status: 400 });
    }

    const now = Date.now();
    const tracker = otpAttemptMap.get(cleanPhone) || { attempts: 0, lockedUntil: 0, lastSent: 0 };

    if (tracker.lockedUntil > now) {
      const waitMin = Math.ceil((tracker.lockedUntil - now) / 60000);
      return NextResponse.json({
        success: false,
        message: `به دلیل تلاش‌های ناموفق بیش از حد، دسترسی شما برای ${waitMin} دقیقه مسدود است.`
      }, { status: 429 });
    }

    if (body.action === 'send') {
      if (now - tracker.lastSent < 60000) {
        return NextResponse.json({ success: false, message: 'لطفاً ۱ دقیقه قبل از درخواست مجدد کد شکیبا باشید.' }, { status: 429 });
      }

      // تولید کد ۶ رقمی امن
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(now + 180 * 1000).toISOString();
      const nonce = crypto.randomBytes(4).toString('hex');

      const hmac = crypto.createHmac('sha256', OTP_HMAC_SECRET);
      hmac.update(`${cleanPhone}:${generatedCode}:${expiresAt}:${nonce}`);
      const signature = hmac.digest('hex');

      tracker.lastSent = now;
      tracker.attempts = 0;
      otpAttemptMap.set(cleanPhone, tracker);

      await sendSMS(cleanPhone, `کد تایید ورود شما به آکسون: ${generatedCode}`);

      return NextResponse.json({
        success: true,
        message: 'کد تایید ۶ رقمی با موفقیت ارسال شد.',
        token: `${expiresAt}:${nonce}:${signature}`,
      });
    }

    if (body.action === 'verify') {
      const cleanCode = String(body.code || '').trim();
      const receivedToken = String(body.token || '').trim();

      if (!cleanCode || !receivedToken || !receivedToken.includes(':')) {
        return NextResponse.json({ success: false, verified: false, message: 'کد تایید یا توکن امنیتی ناقص است.' }, { status: 400 });
      }

      const parts = receivedToken.split(':');
      if (parts.length !== 3) {
        return NextResponse.json({ success: false, verified: false, message: 'توکن نامعتبر است.' }, { status: 400 });
      }

      const [expiresAtStr, nonce, receivedSignature] = parts;
      const expiryTime = new Date(expiresAtStr).getTime();

      if (isNaN(expiryTime) || now > expiryTime) {
        return NextResponse.json({ success: false, verified: false, message: 'کد تایید منقضی گردیده است.' }, { status: 400 });
      }

      const hmac = crypto.createHmac('sha256', OTP_HMAC_SECRET);
      hmac.update(`${cleanPhone}:${cleanCode}:${expiresAtStr}:${nonce}`);
      const expectedSignature = hmac.digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');

      const isMatch = expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isMatch) {
        tracker.attempts++;
        if (tracker.attempts >= 5) {
          tracker.lockedUntil = now + 15 * 60 * 1000;
        }
        otpAttemptMap.set(cleanPhone, tracker);
        return NextResponse.json({
          success: false,
          verified: false,
          message: `کد تایید اشتباه است. (فرصت باقیمانده: ${Math.max(0, 5 - tracker.attempts)})`
        }, { status: 400 });
      }

      otpAttemptMap.delete(cleanPhone);
      return NextResponse.json({ success: true, verified: true, message: 'احراز هویت شماره همراه تایید شد.' });
    }

    return NextResponse.json({ success: false, message: 'نوع عملیات نامعتبر است.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
