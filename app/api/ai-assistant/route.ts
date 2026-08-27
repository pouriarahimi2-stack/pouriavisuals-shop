// File Path: app/api/ai-assistant/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const history = body.history || [];
    const role = body.role || "customer";
    const imageBase64 = body.imageBase64;
    const productsData = body.productsData || [];

    const isSeoArticleRequest =
      role === "admin" &&
      (userMessage.includes("سئو") ||
        userMessage.includes("مقاله") ||
        userMessage.includes("پکیج") ||
        userMessage.includes("آنالیز"));

    const [productsRes, siteInfoRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, name, price, discount_price, category, stock, is_available, description, specs, highlights"),
      supabase.from("site_info").select("site_name, tagline, phone, description").limit(1).maybeSingle(),
    ]);

    const products = productsData.length > 0 ? productsData : productsRes.data || [];
    const siteInfo = siteInfoRes.data || { site_name: "آکسون (Axon)", tagline: "مرجع تخصصی تجهیزات دیجیتال" };

    if (isSeoArticleRequest && products.length > 0) {
      const generatedSeoArticle = generateComprehensiveSeoArticle(products, siteInfo.site_name);
      return NextResponse.json({
        success: true,
        response: generatedSeoArticle,
        reply: generatedSeoArticle,
      });
    }

    const productCatalogContext = products
      .map(
        (p: any) =>
          `• [شناسه: ${p.id}] ${p.title || p.name} | دسته: ${p.category} | قیمت: ${(p.discount_price || p.price || 0).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 0} عدد | توضیحات: ${p.description || "ندارد"}`
      )
      .join("\n");

    const systemPrompt = `تو «دستیار هوشمند و مشاور تخصصی فروشگاه ${siteInfo.site_name}» هستی.
شعار فروشگاه: ${siteInfo.tagline}
سیاست‌های اصلی:
۱. با لحنی محترمانه، متخصصانه، صمیمی، دقیق و هوشمند پاسخ بده.
۲. به تمام سوالات تخصصی کاربران درباره تکنولوژی، مانیتورهای تدوین، کالرگریدینگ، دقت رنگ، انواع پنل‌ها (IPS, OLED, Mini-LED)، سخت‌افزار و مقایسه رزولوشن‌ها با بالاترین سطح علمی پاسخ بده.
۳. در حین پاسخ‌دهی، پاسخ را بر اساس موجودی واقعی انبار فروشگاه ما ارائه بده.
۴. اگر کالا در کاتالوگ موجود است، با ذکر قیمت و ویژگی‌های فنی پیشنهاد بده.

کاتالوگ محصولات فعال فروشگاه:
${productCatalogContext || "در حال حاضر کالایی در ویترین ثبت نشده است."}`;

    let aiResponse = "";
    let matchedProductId: string | null = null;

    const lowerQuery = userMessage.toLowerCase();

    const matchedProduct = products.find(
      (p: any) =>
        (p.title && lowerQuery.includes(p.title.toLowerCase())) ||
        (p.name && lowerQuery.includes(p.name.toLowerCase())) ||
        (p.category && lowerQuery.includes(p.category.toLowerCase()))
    );

    if (matchedProduct) {
      matchedProductId = matchedProduct.id;
    }

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
                    { text: systemPrompt },
                    ...history.map((h: any) => ({ text: `${h.role === "user" ? "کاربر" : "دستیار"}: ${h.text || (h.parts && h.parts[0]?.text) || ""}` })),
                    { text: `پیام کاربر: ${userMessage}` },
                    ...(imageBase64
                      ? [
                          {
                            inline_data: {
                              mime_type: "image/jpeg",
                              data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                            },
                          },
                        ]
                      : []),
                  ],
                },
              ],
            }),
          }
        );
        const geminiData = await geminiReq.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        console.error("Gemini API Call Error:", err);
      }
    }

    if (!aiResponse) {
      if (lowerQuery.includes("سلام") || lowerQuery.includes("درود")) {
        aiResponse = `سلام و درود! خوش آمدید به فروشگاه **${siteInfo.site_name}** ⚡\nمن دستیار هوشمند و مشاور تخصصی شما هستم. چه در مورد انتخاب بهترین تجهیزات و مانیتورها سوال داشته باشید، چه در مورد استانداردهای رنگ، استعلام کالا یا مقایسه مدل‌ها، با کمال میل راهنماییتان می‌کنم. چطور می‌توانم کمکتان کنم؟`;
      } else if (matchedProduct) {
        aiResponse = `محصول **«${matchedProduct.title || matchedProduct.name}»** در دسته **${matchedProduct.category}** با مشخصات زیر در انبار موجود است:\n\n🔹 **قیمت با تخفیف ویژه:** ${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان\n🔹 **وضعیت موجودی:** ${matchedProduct.stock ?? 0} عدد موجود در انبار\n\nمی‌توانید برای مشاهده مشخصات کامل یا ثبت سفارش مستقیم از دکمه زیر استفاده کنید.`;
      } else {
        aiResponse = `درخواست شما بررسی شد. شما می‌توانید محصولات موجود در کاتالوگ فروشگاه را با تضمین اصالت و گارانتی ۱۸ ماهه مشاهده و سفارش دهید. در صورت نیاز به راهنمایی در مورد کالای خاص، نام آن را بفرمایید.`;
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      matchedProductId,
    });
  } catch (error: any) {
    console.error("AI Assistant API Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        response: "در حال حاضر ارتباط با دستیار هوشمند برقرار نشد. لطفاً مجدداً پیام خود را ارسال فرمایید.",
      },
      { status: 500 }
    );
  }
}

function generateComprehensiveSeoArticle(products: any[], storeName: string): string {
  const p = products[0];
  const title = p.title || p.name || "تجهیزات دیجیتال پیشرفته";
  const cat = p.category || "سخت‌افزار";
  const priceFormatted = Number(p.discount_price || p.price || 0).toLocaleString("fa-IR");

  return `# راهنمای جامع خرید و نقد تخصصی ${title}؛ برگزیده دسته ${cat}

**Title Tag:** بررسی و خرید ${title} با گارانتی اصالت | فروشگاه ${storeName}
**Meta Description:** نقد و بررسی جامع ${title}، مشخصات فنی، بنچ‌مارک سرعت و تست کالیبراسیون به همراه راهنمای خرید با کمترین قیمت بازار در فروشگاه تخصصی ${storeName}.
**کلمات کلیدی اصلی:** خرید ${title}، بررسی تخصصی ${title}، قیمت ${title} در بازار، گارانتی ${storeName}

---

## مقدمه: چرا ${title} انتخابی متمایز در بازار ${cat} است؟
در دنیای پرشتاب فناوری، داشتن ابزارهایی با پایداری عملکردی بی‌نقص و استانداردهای کیفی بالا اهمیت دوچندانی پیدا کرده است. محصول **${title}** با تکیه بر استانداردهای مهندسی مدرن توانسته است نظر کاربران حرفه‌ای را به خود جلب کند.

---

## بررسی مشخصات فنی و کیفیت ساخت
${title} دارای ویژگی‌های فنی برجسته‌ای است که ارزش خرید آن را دوچندان می‌کند:
* **پایداری عملکردی:** مهندسی قطعات بهینه‌شده برای کارکرد مداوم بدون افت کارایی.
* **کیفیت متریال:** استفاده از متریال با دوام جهت افزایش طول عمر فیزیکی دستگاه.
* **ارزش خرید:** با توجه به قیمت **${priceFormatted} تومان**، از گزینه‌های بسیار مناسب بازار است.

---

## سوالات متداول خریداران (FAQ)
**۱. آیا ${title} دارای گارانتی رسمی است؟**
بله، تمامی کالاهای ارائه‌شده در فروشگاه ${storeName} دارای ضمانت اصالت فیزیکی و مهلت تست می‌باشند.

---

## جمع‌بندی نهایی
شما می‌توانید هم‌اکنون این محصول را با **تضمین کمترین قیمت بازار و ارسال سریع پیشتاز** از فروشگاه ${storeName} تهیه فرمایید.`;
}