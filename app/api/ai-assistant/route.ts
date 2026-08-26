import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const history = body.history || [];
    const role = body.role || "customer";
    const imageBase64 = body.imageBase64;
    const productsData = body.productsData;

    const [productsRes, siteInfoRes] = await Promise.all([
      supabase.from("products").select("id, title, name, price, discount_price, category, stock, is_available, description, specs"),
      supabase.from("site_info").select("site_name, tagline, phone, description").limit(1).maybeSingle(),
    ]);

    const products = Array.isArray(productsData) && productsData.length > 0 ? productsData : (productsRes.data || []);
    const siteInfo = siteInfoRes.data || { site_name: "آکسون (Axon)", tagline: "مرجع تخصصی تجهیزات دیجیتال" };

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