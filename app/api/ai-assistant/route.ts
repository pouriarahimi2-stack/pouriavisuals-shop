// File Path: app/api/ai-assistant/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const history = body.history || [];
    const role = body.role || "customer";
    const productsData = body.productsData || [];
    const targetTopic = body.targetTopic || "";

    const isSeoArticleRequest =
      role === "admin" &&
      (userMessage.includes("سئو") ||
        userMessage.includes("مقاله") ||
        userMessage.includes("پکیج") ||
        userMessage.includes("آنالیز") ||
        Boolean(targetTopic));

    const [productsRes, siteInfoRes] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, title, name, price, discount_price, category, stock, is_available, description, specs, highlights, images, image"),
      supabaseAdmin.from("site_info").select("site_name, tagline, phone, description").limit(1).maybeSingle(),
    ]);

    const products = productsData.length > 0 ? productsData : productsRes.data || [];
    const siteInfo = siteInfoRes.data || { site_name: "آکسون (Axon)", tagline: "مرجع تخصصی تجهیزات دیجیتال و استودیو" };

    if (isSeoArticleRequest) {
      let generatedArticle = "";
      if (process.env.GEMINI_API_KEY) {
        try {
          const productContext = products
            .slice(0, 10)
            .map(
              (p: any) =>
                `• عنوان: ${p.title || p.name} | شناسه: ${p.id} | قیمت: ${(p.discount_price || p.price || 0).toLocaleString("fa-IR")} تومان | دسته: ${p.category} | لینک: /products/${p.id} | مشخصات: ${JSON.stringify(p.specs || {})}`
            )
            .join("\n");

          const prompt = `تو متخصص ارشد سئو رنک ۱ گوگل در ایران هستی.
یک مقاله جامع، استثنایی و با کیفیت درباره «${targetTopic || userMessage}» تولید کن.
الزامات:
۱. عنوان جذاب سئو (H1) و Meta Description.
۲. لینک‌دهی هوشمند به محصولات زیر:
${productContext}
۳. فرمت HTML با تگ‌های معنایی کامل.
۴. جدول مقایسه فنی و بخش FAQ Schema.
۵. تصاویر مرتبط با تگ <img> از دامنه Unsplash.`;

          const geminiReq = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
              }),
            }
          );
          const geminiData = await geminiReq.json();
          generatedArticle = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (aiErr) {
          console.warn("AI Article Gen Error:", aiErr);
        }
      }

      if (!generatedArticle) {
        generatedArticle = generateRankOneSeoArticle(products, siteInfo.site_name, targetTopic || userMessage);
      }

      return NextResponse.json({
        success: true,
        response: generatedArticle,
        reply: generatedArticle,
      });
    }

    const productCatalogContext = products
      .map(
        (p: any) =>
          `• [کد: ${p.id}] ${p.title || p.name} | دسته: ${p.category} | قیمت: ${(p.discount_price || p.price || 0).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 0} عدد`
      )
      .join("\n");

    const systemPrompt = `تو مشاور تخصصی و دستیار هوش مصنوعی فروشگاه «${siteInfo.site_name}» هستی. به تمام سوالات در زمینه مانیتورها، کالیبراسیون تصویر و تجهیزات استودیویی با دقت مهندسی پاسخ بده.`;

    let aiResponse = "";
    let matchedProductId: string | null = null;
    const lowerQuery = userMessage.toLowerCase();

    const matchedProduct = products.find(
      (p: any) =>
        (p.title && lowerQuery.includes(p.title.toLowerCase())) ||
        (p.name && lowerQuery.includes(p.name.toLowerCase()))
    );

    if (matchedProduct) matchedProductId = String(matchedProduct.id);

    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiReq = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: `${systemPrompt}\nکاتالوگ فروشگاه:\n${productCatalogContext}` },
                    ...history.map((h: any) => ({ text: `${h.role === "user" ? "کاربر" : "دستیار"}: ${h.text || (h.parts && h.parts[0]?.text) || ""}` })),
                    { text: `پرسش کاربر: ${userMessage}` },
                  ],
                },
              ],
            }),
          }
        );
        const geminiData = await geminiReq.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch {}
    }

    if (!aiResponse) {
      if (matchedProduct) {
        aiResponse = `کالای **«${matchedProduct.title || matchedProduct.name}»** در دسته **${matchedProduct.category}** با مشخصات زیر موجود است:\n\n🔹 **قیمت با تخفیف:** ${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان\n🔹 **وضعیت موجودی:** ${matchedProduct.stock ?? 0} عدد در انبار\n\nجهت بررسی جزئیات کالبدشکافی ۳D یا ثبت سفارش از دکمه زیر استفاده نمایید.`;
      } else {
        aiResponse = `درود! چطور می‌توانم در خصوص خرید، مشخصات مانیتورهای ۵K، کارت‌های کپچر و تجهیزات استودیویی به شما کمک کنم؟`;
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      matchedProductId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

function generateRankOneSeoArticle(products: any[], storeName: string, topic: string): string {
  const p = products[0] || { id: "1", title: "مانیتور ۵K استودیویی آکسون", price: 65000000, category: "سخت‌افزار" };
  const priceFormatted = Number(p.discount_price || p.price || 0).toLocaleString("fa-IR");

  return `<h1>راهنمای جامع خرید و بررسی تخصصی: ${topic || p.title} (استاندارد ۲۰۲۶)</h1>

<p><strong>Title Tag:</strong> بررسی و خرید ${topic || p.title} با گارانتی اصالت طلایی | فروشگاه ${storeName}</p>
<p><strong>Meta Description:</strong> راهنمای تخصصی خرید ${topic || p.title}، کالیبراسیون سخت‌افزاری رنگ و بنچ‌مارک در فروشگاه تخصصی ${storeName}.</p>

<img src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000" alt="${topic || p.title}" style="width:100%; border-radius:24px; margin:20px 0;" />

<h2>مقدمه و تحلیل نیازهای فنی تدوین‌گران</h2>
<p>در صنعت تولید محتوا و اصلاح رنگ ویدیو، دقت نمایشگر و سرعت ارتباطی از اهمیت حیاتی برخوردار است. محصول <a href="/products/${p.id}"><strong>${p.title}</strong></a> با پشتیبانی کامل از طیف‌های رنگی سینمایی توانسته تحولی در بازار ایجاد کند.</p>

<div style="border-right: 4px solid #0071e3; background: rgba(0,113,227,0.08); padding: 16px; border-radius: 16px; margin: 20px 0;">
  <strong style="color:#0071e3;">💡 توصیه کارشناسی:</strong>
  <span>کالیبراسیون سخت‌افزاری با انحراف رنگی Delta E کمتر از ۰.۵ تضمین‌کننده خروجی بدون نقص در نرم‌افزارهای DaVinci Resolve است.</span>
</div>

<h2>جدول مقایسه فنی و پارامترهای مهندسی</h2>
<table border="1" style="width:100%; border-collapse:collapse; margin:20px 0;">
  <thead>
    <tr style="background:rgba(255,255,255,0.08);">
      <th style="padding:10px;">شاخص</th>
      <th style="padding:10px;">مشخصه فنی</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:10px;">کالای مرتبط در انبار</td><td style="padding:10px;"><a href="/products/${p.id}">${p.title}</a></td></tr>
    <tr><td style="padding:10px;">قیمت ویژه با تخفیف</td><td style="padding:10px;">${priceFormatted} تومان</td></tr>
    <tr><td style="padding:10px;">گارانتی و خدمات</td><td style="padding:10px;">۱۸ ماه گارانتی تعویض طلایی</td></tr>
  </tbody>
</table>

<h2>سوالات متداول (FAQ)</h2>
<h3>آیا این کالا با مک‌بوک و ویندوز سازگار است؟</h3>
<p>بله، با تمامی دیوایس‌های مجهز به درگاه Thunderbolt و Type-C سازگاری کامل دارد.</p>

<p>شما می‌توانید هم‌اکنون برای خرید مستقیم و بررسی جزئیات کالا به <a href="/products/${p.id}">صفحه خرید اختصاصی ${p.title}</a> مراجعه فرمایید.</p>`;
}