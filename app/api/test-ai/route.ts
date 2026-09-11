import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const adminToken = req.cookies.get('pv_admin_session')?.value || req.cookies.get('admin_session_token')?.value;

    // محافظت از endpoint در برابر دسترسی ناشناس عمومی
    if (!authHeader.includes('Bearer') && !adminToken) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز. فقط ادمین مجاز است.' }, { status: 401 });
    }

    const { apiKey } = await req.json();
    const cleanKey = String(apiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!cleanKey) {
      return NextResponse.json({ success: false, message: 'کلید API هوش مصنوعی یافت نشد.' }, { status: 400 });
    }

    const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'سلام! یک کلمه بگو: فعال' }] }],
      }),
    });

    const testJson = await testRes.json();
    if (testJson.error) {
      return NextResponse.json({ success: false, message: testJson.error.message || 'خطا در ارتباط با مدل گوگل.' }, { status: 400 });
    }

    const text = testJson.candidates?.[0]?.content?.parts?.[0]?.text || 'آماده';

    return NextResponse.json({
      success: true,
      message: `✓ اتصال برقرار شد! پاسخ هوش مصنوعی: "${text.trim()}"`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'خطا در آزمون اتصال هوش مصنوعی.' }, { status: 500 });
  }
}
