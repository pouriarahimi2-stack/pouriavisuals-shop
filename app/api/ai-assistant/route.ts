import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'متن پیام الزامی است.' },
        { status: 400 }
      );
    }

    // دریافت لیست محصولات موجود جهت ارائه اطلاعات دقیق توسط هوش مصنوعی
    const { data: products } = await supabase
      .from('products')
      .select('id, name, title, price, stock, category, is_available')
      .limit(30);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://axoncore.ir';

    const systemPrompt = `شما دستیار هوشمند و مشاور خرید رسمی فروشگاه AxonCore (به آدرس ${siteUrl}) هستید.
وظیفه شما راهنمایی خریداران با لحنی صمیمی، حرفه‌ای و به زبان فارسی است.
اطلاعات محصولات موجود:
${JSON.stringify(products || [], null, 2)}

قوانین پاسخ‌دهی:
۱. فقط بر اساس موجودی و مشخصات محصولات بالا راهنمایی کن.
۲. لینک محصولات را به صورت مستقیم و با ساختار ${siteUrl}/products/[id] به کاربر پیشنهاد بده.
۳. در صورت ناموجود بودن کالا، آن را با صراحت بگو و جایگزین مناسب معرفی کن.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'کلید ارتباط با هوش مصنوعی تنظیم نشده است.' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }],
            },
            ...(history || []).map((h: { role: string; content: string }) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }],
            })),
            {
              role: 'user',
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API Error:', errText);
      return NextResponse.json(
        { error: 'خطا در ارتباط با سرویس هوش مصنوعی.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'متأسفانه در حال حاضر پاسخی دریافت نشد.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI Assistant Route Error:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور در پردازش درخواست.' },
      { status: 500 }
    );
  }
}