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
      return NextResponse.json({ success: false, message: "پیامی ارسال نشده است." }, { status: 400 });
    }

    let products = FLAGSHIP_7_PRODUCTS;
    let siteInfoData: any = null;

    try {
      if (supabaseAdmin) {
        const [prodsRes, infoRes] = await Promise.all([
          supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle(),
        ]);

        if (prodsRes.data && prodsRes.data.length > 0) products = prodsRes.data;
        if (infoRes.data) siteInfoData = infoRes.data;
      }
    } catch (e) {}

    const apiKey =
      siteInfoData?.gemini_api_key ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const storeName = siteInfoData?.site_name || siteInfoData?.store_name || "آکسون | Axon";
    const storePhone = siteInfoData?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";

    const productCatalogContext = products
      .map(
        (p: any) =>
          `• [شناسه: ${p.id}] نام: ${p.title || p.name} | برند: ${p.brand || "Apple"} | دسته: ${p.category || "تکنولوژی"} | قیمت: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 10} عدد | مشخصات: ${JSON.stringify(p.specs || {})}`
      )
      .join("\n");

    const systemInstruction = `تو مشاور هوشمند و مهندس ارشد فناوری در فروشگاه پیشرفته تکنولوژی ${storeName} هستی.
به زبان فارسی کاملاً روان، صمیمی، حرفه‌ای و دقیقاً متناسب با سوال کاربر پاسخ بده.
- در حوزه تکنولوژی، گجت‌ها، مانیتورها، مک‌بوک‌ها، کارت‌های کپچر و ابزارهای کالیبراسیون راهنمایی کن.
- اگر کاربر درباره گارانتی و ارسال پرسید، توضیح بده که تمامی کالاها دارای ۱۸ ماه گارانتی اصالت طلایی، ۷ روز مهلت تست و ارسال رایگان پیشتاز برای خریدهای بالای ۲ میلیون تومان هستند.
- شماره پشتیبانی: ${storePhone}

کاتالوگ محصولات موجود در انبار:
${productCatalogContext}`;

    let aiResponse = "";
    const cleanKey = apiKey ? String(apiKey).trim() : "";

    if (cleanKey && cleanKey.length > 15) {
      const endpointsToTry = [
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      ];

      for (const ep of endpointsToTry) {
        try {
          const parts: any[] = [{ text: `${systemInstruction}\n\n[پیام کاربر]: ${userMessage}` }];
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
          }

          const geminiRes = await fetch(`${ep}?key=${cleanKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
            }),
          });

          const geminiJson = await geminiRes.json();
          if (geminiJson.error) continue;

          const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            aiResponse = text;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    const normalized = userMessage.toLowerCase();

    if (!aiResponse) {
      if (normalized.includes("گارانتی") || normalized.includes("ارسال") || normalized.includes("ضمانت")) {
        aiResponse = "تمامی سفارش‌های فروشگاه آکسون با **۱۸ ماه گارانتی اصالت طلایی**، ۷ روز مهلت تست سلامت فیزیکی و بسته‌بندی ضدضربه استودیویی ارسال می‌شوند. همچنین کلیه خریدهای بالای ۲ میلیون تومان شامل **ارسال رایگان با پست پیشتاز** به سراسر ایران هستند. 📦🛡️";
      } else if (normalized.includes("سامسونگ") || normalized.includes("samsung")) {
        aiResponse = "در حال حاضر در فروشگاه آکسون محصولات برند **سامسونگ** موجود نیست و تمرکز ما بر مانیتورها و تجهیزات تخصصی **Apple**، **Blackmagic Design** و **Calibrite** است. اگر مانیتور حرفه‌ای مد نظرتان است، مانیتور **Apple Studio Display 5K** را به شما پیشنهاد می‌کنم.";
      } else if (normalized.includes("مک بوک") || normalized.includes("macbook")) {
        aiResponse = "لپ‌تاپ پرچمدار **MacBook Pro 16\" M4 Max** با رم ۱۲۸ گیگابایت و ۲ ترابایت SSD با قیمت ویژه و گارانتی طلایی در انبار موجود است.";
      } else {
        aiResponse = `سلام و درود! من مشاور هوشمند تکنولوژی فروشگاه ${storeName} هستم. چطور می‌توانم در انتخاب تجهیزات و کالاهای دیجیتال راهنماییتان کنم؟`;
      }
    }

    const lowerResp = (aiResponse + " " + userMessage).toLowerCase();
    const matchedProduct = products.find((p: any) => {
      const id = String(p.id).toLowerCase();
      const t = (p.title || "").toLowerCase();
      return lowerResp.includes(id) || (t.length > 5 && lowerResp.includes(t.slice(0, 15)));
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
