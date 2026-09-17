import { NextResponse } from 'next/server';
import { sendOtpPattern } from '@/lib/otpService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile || typeof mobile !== 'string' || mobile.length < 10) {
      return NextResponse.json({ success: false, error: 'شماره موبایل معتبر نیست.' }, { status: 400 });
    }

    // تولید کد تصادفی ۶ رقمی
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: کد otpCode را موقتاً در دیتابیس (یا جدول کاربران/سشن‌ها) همراه با تاریخ انقضا (مثلا ۲ دقیقه) ذخیره کنید.

    // ارسال پیامک
    const isSent = await sendOtpPattern({ mobile, code: otpCode });

    if (!isSent) {
      return NextResponse.json({ success: false, error: 'خطا در ارسال پیامک از طریق سامانه رخ داد.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'کد تایید با موفقیت ارسال شد.' 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}