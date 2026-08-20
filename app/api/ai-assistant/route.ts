import { NextRequest, NextResponse } from 'next/server';

const aiRateLimiter = new Map<string, { count: number; lastReset: number }>();
const AI_WINDOW = 60 * 1000; // ۱ دقیقه
const MAX_AI_REQUESTS = 10;

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = aiRateLimiter.get(ip);

  if (!entry || now - entry.lastReset > AI_WINDOW) {
    aiRateLimiter.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (entry.count >= MAX_AI_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, message: 'متن پیام الزامی است.' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || 'local-user';
    if (checkAiRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    // ارسال امن به OpenRouter از طریق هدر Authorization (نه Query Param)
    if (apiKey) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://my-apple-store.local',
          'X-Title': 'Apple Store Assistant',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content: 'شما دستیار هوشمند و مشاور تخصصی فروشگاه محصولات اپل و لوازم جانبی هستید. با لحنی مودبانه، حرفه‌ای و به زبان فارسی پاسخ دهید.',
            },
            ...(Array.isArray(history) ? history.slice(-6) : []),
            { role: 'user', content: message },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return NextResponse.json({ success: true, reply });
        }
      }
    }

    // پاسخ هوشمند سریع لوکال در صورت عدم دسترسی به API خارجی
    const fallbackReply = 'درود! من در حال حاضر دستیار فروشگاه هستم. برای راهنمایی درباره موجودی آیفون، مک‌بوک یا پیگیری سفارش در خدمت شما هستم.';
    return NextResponse.json({ success: true, reply: fallbackReply });
  } catch {
    return NextResponse.json(
      { success: true, reply: 'متاسفانه در حال حاضر ارتباط با سرور هوش مصنوعی برقرار نشد. لطفاً مجدداً پیام دهید.' },
      { status: 200 }
    );
  }
}