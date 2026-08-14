import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { response: "خطا: کلید GEMINI_API_KEY در فایل env.local یافت نشد." },
        { status: 200 }
      );
    }

    const { prompt, role, history, productsData, imageBase64 } = await req.json();

    const PROXY_URL = "https://aged-tree-e967.nova-c075e0.workers.dev";

    let systemInstruction = "";

    if (role === "admin") {
      systemInstruction = `
        تو مدیر ارشد رشد، قیمت‌گذاری پویا، بازارسنجی و متخصص ارشد سئو (SEO Director) هستی.
        
        وقتی ادمین درخواست **تولید مقاله یا پکیج سئو** برای یک محصول مشخص را داد، باید خروجی را کاملاً جامع شامل بخش‌های زیر بسازی:

        ۱. **عنوان جذاب و سئو شده (Title Tag):** ۵۰ تا ۶۰ کاراکتر، شامل کلمه کلیدی اصلی و جذابیت خرید.
        ۲. **توضیحات متا (Meta Description):** ۱۳۰ تا ۱۶۰ کاراکتر، ترغیب‌کننده برای کلیک در گوگل.
        ۳. **کلمات کلیدی LSI و اصلی:** کلمات پرسرچ مرتبط.
        ۴. **هشتگ‌های پربازدید:** برای شبکه‌های اجتماعی و جستجو.
        ۵. **متن کامل مقاله سئو شده:** 
           - رعایت H1, H2, H3.
           - مقدمه جذاب، بررسی تخصصی، جدول مقایسه‌ای و نتیجه‌گیری.
           - **لینک‌دهی داخلی هوشمند:** لینک مستقیم به صفحه همان محصول در سایت.
           - خوانایی بالا و لحن متقاعدکننده.

        دیتابیس محصولات فعلی سایت:
        ${JSON.stringify(productsData || [])}
      `;
    } else {
      systemInstruction = `
        تو دستیار ۲۴ ساعته فروشگاه هستی.
        اطلاعات محصولات: ${JSON.stringify(productsData || [])}
      `;
    }

    const currentParts: any[] = [{ text: prompt || "بررسی درخواست" }];

    if (imageBase64) {
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        currentParts.push({
          inlineData: { mimeType: matches[1], data: matches[2] },
        });
      }
    }

    const contents = [
      ...(history || []),
      { role: "user", parts: currentParts },
    ];

    const endpoint = `${PROXY_URL}/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const requestBody: any = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
    };

    if (role === "admin") {
      requestBody.tools = [{ googleSearch: {} }];
    }

    let googleResponse;
    let attempts = 0;

    while (attempts < 3) {
      attempts++;
      googleResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (googleResponse.ok) break;

      if (attempts >= 2 && role === "admin") {
        delete requestBody.tools;
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return NextResponse.json(
        { response: "در حال حاضر سرور پاسخگو نیست، لطفاً دوباره تلاش کنید." },
        { status: 200 }
      );
    }

    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "پاسخی دریافت نشد.";

    return NextResponse.json({
      response: responseText.trim(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { response: `خطا در ارتباط: ${error?.message || "مشکل نامشخص"}` },
      { status: 200 }
    );
  }
}