// File Path: app/api/ai-assistant/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = String(body.message || body.prompt || "").trim();
    const imageBase64 = body.imageBase64 || null;

    if (!userMessage && !imageBase64) {
      return NextResponse.json({ success: false, message: "پیام یا تصویری ارسال نشده است." }, { status: 400 });
    }

    let products = FLAGSHIP_7_PRODUCTS;
    let siteInfoData: any = null;

    try {
      if (supabaseAdmin) {
        const [prodsRes, infoRes] = await Promise.all([
          supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle(),
        ]);

        if (prodsRes.data && prodsRes.data.length > 0) {
          products = prodsRes.data;
        }
        if (infoRes.data) {
          siteInfoData = infoRes.data;
        }
      }
    } catch (e) {}

    // استخراج امن کلید از دیتابیس پنل ادمین یا متغیرهای سرور
    const apiKey =
      siteInfoData?.gemini_api_key ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const storeName = siteInfoData?.site_name || siteInfoData?.store_name || "آکسون | Axon";
    const storePhone = siteInfoData?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";

    const productCatalogContext = products
      .map(
        (p: any) =>
          `• [شناسه کالا: ${p.id}] نام: ${p.title || p.name} | برند: ${p.brand || "Apple"} | دسته: ${p.category || "تجهیزات"} | قیمت: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 10} عدد | مشخصات: ${JSON.stringify(p.specs || {})}`
      )
      .join("\n");

    const systemInstruction = `تو «مشاور هوشمند و مهندس ارشد سخت‌افزار استودیو ${storeName}» هستی.
به زبان فارسی کاملاً روان، صمیمی، حرفه‌ای و دقیقاً متناسب با سوال کاربر پاسخ بده.
- اگر کاربر نام برندی که در فروشگاه موجود نیست (مانند سامسونگ، ال‌جی، ایسوس، دل و...) را پرسید، با کمال احترام و هوشمندی به او بگو که در حال حاضر در فروشگاه ${storeName} محصولات این برند موجود نیست و تمرکز تخصصی ما روی تجهیزات حرفه‌ای، مانیتورهای ۵K/6K و ورک‌استیشن‌های تدوین برندهای اپل (Apple)، بلک‌مجیک (Blackmagic) و کالیبرایت (Calibrite) است و بهترین گزینه‌های معادل موجود را با استدلال فنی پیشنهاد بده.
- اگر کاربر سلام یا احوال‌پرسی کرد، گرم و پرانرژی جواب بده.
- اگر قیمت یا مشخصات خواست، با قیمت دقیق به تومان پاسخ بده.
شماره پشتیبانی: ${storePhone}

کاتالوگ محصولات موجود در انبار:
${productCatalogContext}`;

    let aiResponse = "";
    const cleanKey = apiKey ? String(apiKey).trim() : "";

    if (cleanKey && cleanKey.length > 15) {
      const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-pro"];

      for (const modelName of candidateModels) {
        try {
          const parts: any[] = [{ text: `${systemInstruction}\n\n[پیام کاربر]: ${userMessage}` }];
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
          }

          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": cleanKey,
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
            }),
          });

          const geminiJson = await geminiRes.json();
          const replyText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            aiResponse = replyText;
            break;
          }
        } catch (e) {}
      }
    }

    if (!aiResponse) {
      aiResponse = `درود بر شما! من مشاور تخصصی تجهیزات تصویر و مانیتورهای استودیو آکسون هستم.
لطفاً کلید اختصاصی Gemini API خود را در پنل ادمین (بخش اطلاعات سایت) وارد فرمایید تا هوش مصنوعی با تمام ظرفیت پاسخگوی شما باشد.`;
    }

    // پیوست هوشمند کارت خرید
    const lowerResp = (aiResponse + " " + userMessage).toLowerCase();
    const matchedProduct = products.find((p: any) => {
      const id = String(p.id).toLowerCase();
      return (
        lowerResp.includes(id) ||
        (lowerResp.includes("studio display") && id.includes("studio")) ||
        (lowerResp.includes("xdr") && id.includes("xdr")) ||
        (lowerResp.includes("macbook") && id.includes("macbook")) ||
        (lowerResp.includes("watch") && id.includes("watch")) ||
        (lowerResp.includes("ipad") && id.includes("ipad")) ||
        (lowerResp.includes("decklink") && id.includes("decklink")) ||
        (lowerResp.includes("calibrite") && id.includes("calibrite"))
      );
    });

    const calculatedPrice = matchedProduct
      ? Number(matchedProduct.discount_price || matchedProduct.discountPrice || matchedProduct.price || 0)
      : 0;

    return NextResponse.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      matchedProduct: matchedProduct
        ? {
            id: matchedProduct.id,
            title: matchedProduct.title || matchedProduct.name,
            price: calculatedPrice,
            discount_price: calculatedPrice,
            image: matchedProduct.images?.[0] || matchedProduct.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      response: `خطا در پردازش: ${error.message}`,
      reply: `خطا در پردازش: ${error.message}`,
      matchedProduct: null,
    });
  }
}
