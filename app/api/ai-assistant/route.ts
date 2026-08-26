// app/api/ai-assistant/route.ts
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

    // ۱. بررسی اگر درخواست برای تولید مقاله سئو تخصصی از پنل ادمین باشد
    const isSeoArticleRequest =
      role === "admin" &&
      (userMessage.includes("سئو") ||
        userMessage.includes("مقاله") ||
        userMessage.includes("پکیج") ||
        userMessage.includes("آنالیز"));

    // ۲. واکشی اطلاعات زنده کاتالوگ فروشگاه از دیتابیس Supabase
    const [productsRes, siteInfoRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, name, price, discount_price, category, stock, is_available, description, specs, highlights"),
      supabase.from("site_info").select("site_name, tagline, phone, description").limit(1).maybeSingle(),
    ]);

    const products = productsData.length > 0 ? productsData : productsRes.data || [];
    const siteInfo = siteInfoRes.data || { site_name: "آکسون (Axon)", tagline: "مرجع تخصصی تجهیزات دیجیتال" };

    // اگر درخواست ساخت پکیج سئو برای محصولات انتخابی باشد:
    if (isSeoArticleRequest && products.length > 0) {
      const generatedSeoArticle = generateComprehensiveSeoArticle(products, siteInfo.site_name);
      return NextResponse.json({
        success: true,
        response: generatedSeoArticle,
        reply: generatedSeoArticle,
      });
    }

    // ۳. سیستم پرامپت دستیار هوشمند مشتری
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
۳. در حین پاسخ‌دهی، پاسخ را به سمت محصولات موجود در فروشگاه ما هدایت کن.
۴. اگر کالا در کاتالوگ موجود است، با ذکر قیمت پیشنهاد بده.

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
        aiResponse = `سلام و درود! خوش آمدید به فروشگاه **${siteInfo.site_name}** ⚡\nمن دستیار هوشمند و مشاور تخصصی شما هستم. چه در مورد انتخاب بهترین مانیتور برای تدوین و طراحی سوال داشته باشید، چه در مورد استانداردهای رنگ، کارت‌های کپچر یا مقایسه مدل‌ها، با کمال میل راهنماییتان می‌کنم. چطور می‌توانم کمکتان کنم؟`;
      } else if (
        lowerQuery.includes("مانیتور") ||
        lowerQuery.includes("تدوین") ||
        lowerQuery.includes("رنگ") ||
        lowerQuery.includes("ips") ||
        lowerQuery.includes("oled") ||
        lowerQuery.includes("4k")
      ) {
        aiResponse = `برای کارهای حساس به رنگ و تدوین حرفه‌ای، مهم‌ترین فاکتورها **دقت پوشش رنگی (حداقل ۹۹٪ sRGB و DCI-P3)**، نوع پنل (ترجیحاً IPS یا OLED کالیبره‌شده) و تفکیک سایه‌روشن‌هاست.\n\nدر مجموعه ما مدل‌های برگزیده‌ای متناسب با همین استانداردها موجود است که می‌توانید مشخصات فنی و تست رنگ آن‌ها را در کاتالوگ بررسی فرمایید. آیا رزولوشن یا برند خاصی مد نظرتان است؟`;
      } else if (matchedProduct) {
        aiResponse = `محصول **«${matchedProduct.title || matchedProduct.name}»** یکی از بهترین گزینه‌ها در دسته ${matchedProduct.category} است.\n\n🔹 **قیمت با تخفیف ویژه:** ${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان\n🔹 **وضعیت موجودی:** آماده ارسال با گارانتی معتبر\n\nمی‌توانید برای مشاهده مشخصات کامل یا ثبت سفارش مستقیم، از دکمه زیر استفاده کنید.`;
      } else {
        aiResponse = `پرسش بسیار خوبی است! من آماده‌ام تا در تمامی زمینه‌های فنی، مشخصات قطعات و انتخاب تجهیزات مورد نیازتان مشاوره‌تان بدهم. همچنین اگر تصویری از دستگاه یا نیاز خود دارید می‌توانید ارسال کنید تا دقیق‌تر بررسی کنیم.`;
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
        response: "در حال حاضر ارتباط با دستیار برقرار نشد. لطفاً مجدداً پیام خود را ارسال فرمایید.",
      },
      { status: 500 }
    );
  }
}

// موتور تولید مقاله جامع سئو با استاندارد گوگل
function generateComprehensiveSeoArticle(products: any[], storeName: string): string {
  const p = products[0];
  const title = p.title || p.name || "تجهیزات دیجیتال پیشرفته";
  const cat = p.category || "سخت‌افزار";
  const priceFormatted = Number(p.discount_price || p.price || 0).toLocaleString("fa-IR");

  return `# راهنمای خرید و نقد تخصصی ${title}؛ پرچمدار دنیای ${cat} در سال ۲۰۲۶

**Title Tag:** بررسی و خرید ${title} با گارانتی اصالت | فروشگاه ${storeName}
**Meta Description:** نقد و بررسی جامع ${title}، مشخصات فنی، بنچ‌مارک سرعت و تست کالیبراسیون به همراه راهنمای خرید با کمترین قیمت بازار در فروشگاه تخصصی ${storeName}.
**کلمات کلیدی اصلی:** خرید ${title}، بررسی تخصصی ${title}، قیمت ${title} در بازار، گارانتی ${storeName}

---

## مقدمه: چرا ${title} انقلابی در بازار ${cat} به پا کرد؟
در عصر پردازش‌های فوق‌سریع و هوش مصنوعی مولد، نیاز به تجهیزاتی با پایداری عملکردی بی‌نقص و دقت مهندسی بالا بیش از هر زمان دیگری احساس می‌شود. محصول **${title}** با تکیه بر معماری نسل جدید و استانداردهای روز دنیا، توانسته است نظر سخت‌گیرترین کارشناسان و کاربران حرفه‌ای را به خود جلب کند.

در این مقاله تحلیلی، به کالبدشکافی لایه‌به‌لایه، بررسی پارامترهای فنی، سیستم خنک‌کاری و ارزش خرید این دستگاه در مقایسه با رقبای مستقیم بازار می‌پردازیم.

---

## بررسی مشخصات فنی و معماری سخت‌افزار
${title} از جدیدترین فناوری‌های صنعتی بهره می‌برد که ارتقای چشمگیری را نسبت به نسل‌های قبلی به نمایش می‌گذارد:

* **توان پردازشی و معماری چیپست:** بهره‌مندی از سیلیکون‌های اختصاصی با راندمان مصرف انرژی بهینه‌شده و شتاب‌دهنده عصبی هوش مصنوعی.
* **دقت بصری و پوشش طیف رنگ:** کالیبراسیون سخت‌افزاری با حداقل انحراف رنگی (Delta E < 1) جهت اطمینان از خروجی واقعی پروژه‌ها.
* **مهندسی بدنه و متالورژی:** استفاده از متریال مرغوب ضدخش و دفع حرارت غیرفعال جهت حفظ پایداری کامل در ساعات کاری طولانی.

### 📊 جدول مشخصات و مقایسه پارامترهای کلیدی
| پارامتر مهندسی | وضعیت در ${title} | استاندارد سایر محصولات بازار |
| :--- | :--- | :--- |
| **کیفیت ساخت بدنه** | متریال هوافضایی ضدضربه | آلیاژهای پلاستیکی فشرده معمولی |
| **دقت رنگ و پوشش Gamut** | ۱۰۰٪ sRGB و ۹۹٪ DCI-P3 | ۸۵٪ sRGB متغیر |
| **پایداری حرارتی** | محفظه خنک‌کاری گرافنی بدون افت توان | نیاز به فن‌های پرصدا در بار کامل |
| **وضعیت گارانتی** | ۱۸ ماه ضمانت طلایی تعویض ${storeName} | گارانتی‌های غیررسمی بدون تست سلامت |

---

## نقاط قوت و ضعف از دیدگاه کارشناسان استودیو

### ✅ مزایای رقابتی:
* عملکرد فوق‌العاده سریع و بهینه‌شده برای پردازش‌های سنگین
* کالیبراسیون دقیق نمایشگر با گستره دینامیکی بالا
* طراحی ارگونومیک، شیک و مینیمال با طول عمر بالای قطعات
* ارزش خرید استثنایی با توجه به قیمت **${priceFormatted} تومان** در فروشگاه

### ⚠️ مواردی که قبل از خرید باید مدنظر داشته باشید:
* حساسیت بالا به کابل‌ها و لوازم جانبی استاندارد اورجینال
* ظرفیت بالای دستگاه که مناسب کاربران حرفه‌ای و نیمه‌حرفه‌ای است

---

## سوالات متداول خریداران (FAQ)

**۱. آیا ${title} دارای گارانتی رسمی و مهلت تست است؟**
بله، تمامی کالاهای ارائه‌شده در فروشگاه ${storeName} دارای ۱۸ ماه ضمانت اصالت فیزیکی و ۷ روز مهلت تست بی‌قیدوشرط می‌باشند.

**۲. این محصول برای چه افرادی بیشترین کاربرد را دارد؟**
این دستگاه به طور ویژه برای طراحان، مهندسان، تولیدکنندگان محتوا و کاربرانی که به دنبال حداکثر دوام و عملکرد هستند طراحی شده است.

---

## جمع‌بندی و نتیجه‌گیری نهایی
اگر به دنبال دستگاهی هستید که تا سال‌ها بدون افت کیفیت و نیاز به ارتقا پاسخگوی نیازهای پردازشی و کاری شما باشد، **${title}** بدون شک یکی از هوشمندانه‌ترین سرمایه‌گذاری‌ها در دسته ${cat} به شمار می‌رود. شما می‌توانید هم‌اکنون این محصول را با **تضمین کمترین قیمت بازار و ارسال سریع پیشتاز** از فروشگاه ${storeName} تهیه فرمایید.`;
}