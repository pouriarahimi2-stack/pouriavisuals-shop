// File Path: app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/services/smsService';

const smsRateLimiter = new Map<string, { count: number; resetTime: number }>();
const SMS_LIMIT_WINDOW = 60 * 1000;
const MAX_SMS_PER_WINDOW = 3;

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = smsRateLimiter.get(ip);

  if (!entry || now > entry.resetTime) {
    smsRateLimiter.set(ip, { count: 1, resetTime: now + SMS_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= MAX_SMS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: 'شماره تماس و متن پیام الزامی است.' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || 'local-caller';
    if (isIpRateLimited(clientIp)) {
      return NextResponse.json(
        { success: false, message: 'تعداد درخواست‌های ارسال بیش از حد مجاز است.' },
        { status: 429 }
      );
    }

    const success = await sendSMS(phone, message);

    if (!success) {
      return NextResponse.json({ success: false, message: 'خطا در ارسال پیامک از طریق درگاه.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'پیامک با موفقیت ارسال شد.' });
  } catch {
    return NextResponse.json({ success: false, message: 'خطای سیستمی در پردازش پیامک.' }, { status: 500 });
  }
}