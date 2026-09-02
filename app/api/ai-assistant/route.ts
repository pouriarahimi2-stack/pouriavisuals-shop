// File Path: app/api/ai-assistant/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productService";

export const dynamic = "force-dynamic";

function normalizePersianText(str: string): string {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/[\u064A\u0649]/g, "ی")
    .replace(/[\u0643]/g, "ک")
    .toLowerCase()
    .trim();
}

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

    const systemInstruction = `تو مشاور هوشمند، استراتژیست ارشد و مهندس تصویر و سخت‌افزار در فروشگاه پیشرفته فناوری ${storeName} هستی.
به زبان فارسی کاملاً سلیس، صمیمی، مهندسی و هوشمندانه پاسخ بده.
- محصولات اصلی فروشگاه شامل مانیتورهای استودیو ۵K و ۶K، لپ‌تاپ‌های مک‌بوک پرو M4 Max، آیپد پرو Tandem OLED، ساعت‌های اولترا، کارت‌های کپچر بلک‌مجیک و ابزارهای کالیبراسیون کالیبرایت هستند.
- اگر کاربر درباره قیمت سوال کرد، قیمت دقیق ریالی/تومانی کالا را با جزئیات گارانتی طلایی اعلام کن.
- اگر کاربر درباره برندهایی مثل سامسونگ، ال‌جی، ایسوس، دل یا سونی پرسید، با استدلال تخصصی و مقایسه فضای رنگی و رزولوشن توضیح بده که تمرکز تخصصی آکسون بر استانداردهای سینمایی و تجهیزات مرجع است و بهترین گزینه‌های معادل کاتالوگ آکسون (مثل Studio Display 5K یا Pro Display XDR) را پیشنهاد کن.
- تمامی محصولات دارای ۱۸ ماه گارانتی اصالت طلایی، ۷ روز ضمانت بازگشت و ارسال رایگان پیشتاز برای خریدهای بالای ۲ میلیون تومان هستند.
- تلفن مشاوره استودیو: ${storePhone}

کاتالوگ کالاهای موجود در انبار:
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

    const normalizedMsg = normalizePersianText(userMessage);

    if (!aiResponse) {
      if (normalizedMsg.includes("قیمت") && (normalizedMsg.includes("studio") || normalizedMsg.includes("استودیو") || normalizedMsg.includes("5k"))) {
        aiResponse = "مانیتور **Apple Studio Display 27\" 5K Retina** با شیشه مات نانوتکستچر و کالیبراسیون سخت‌افزاری در حال حاضر با قیمت ویژه **۱۲۸,۵۰۰,۰۰۰ تومان** و ۱۸ ماه گارانتی اصالت طلایی آکسون در انبار موجود است. 🖥️✨";
      } else if (normalizedMsg.includes("گارانتی") || normalizedMsg.includes("ارسال") || normalizedMsg.includes("ضمانت")) {
        aiResponse = "تمامی سفارش‌های فروشگاه آکسون با **۱۸ ماه گارانتی اصالت طلایی**، ۷ روز مهلت تست سلامت فیزیکی و بسته‌بندی ضدضربه استودیویی ارسال می‌شوند. همچنین کلیه خریدهای بالای ۲ میلیون تومان شامل **ارسال رایگان با پست پیشتاز** به سراسر ایران هستند. 📦🛡️";
      } else if (normalizedMsg.includes("سامسونگ") || normalizedMsg.includes("samsung") || normalizedMsg.includes("الجی") || normalizedMsg.includes("lg")) {
        aiResponse = "در حال حاضر در فروشگاه آکسون محصولات برندهای متفرقه موجود نیست و تمرکز تخصصی ما بر مانیتورها و تجهیزات رفرنس **Apple**، **Blackmagic Design** و **Calibrite** است. اگر مانیتور حرفه‌ای مد نظرتان است، مانیتور **Apple Studio Display 5K** با پوشش ۹۹.۴٪ فضای رنگی P3 بهترین انتخاب است.";
      } else if (normalizedMsg.includes("مک بوک") || normalizedMsg.includes("macbook")) {
        aiResponse = "لپ‌تاپ پرچمدار **MacBook Pro 16\" M4 Max** با رم ۱۲۸ گیگابایت و ۲ ترابایت SSD با قیمت ۲۰۸,۵۰۰,۰۰۰ تومان و گارانتی طلایی در انبار موجود است.";
      } else {
        aiResponse = `سلام و درود! من مشاور هوشمند تکنولوژی فروشگاه ${storeName} هستم. چطور می‌توانم در انتخاب تجهیزات و کالاهای دیجیتال راهنماییتان کنم؟`;
      }
    }

    const normalizedCorpus = normalizePersianText(aiResponse + " " + userMessage);
    
    let matchedProduct = products.find((p: any) => {
      const pId = normalizePersianText(String(p.id));
      const pTitle = normalizePersianText(p.title || "");
      const pTitleFa = normalizePersianText(p.title_fa || "");

      if (normalizedCorpus.includes(pId)) return true;
      if (pTitle.length > 5 && normalizedCorpus.includes(pTitle.slice(0, 14))) return true;
      if (pTitleFa.length > 5 && normalizedCorpus.includes(pTitleFa.slice(0, 14))) return true;

      if (pId.includes("studio-display") && (normalizedCorpus.includes("studio display") || normalizedCorpus.includes("استودیو دیسپلی") || normalizedCorpus.includes("استودیو 5k") || normalizedCorpus.includes("مانیتور 5k"))) return true;
      if (pId.includes("macbook") && (normalizedCorpus.includes("macbook") || normalizedCorpus.includes("مک بوک") || normalizedCorpus.includes("m4 max"))) return true;
      if (pId.includes("watch") && (normalizedCorpus.includes("watch ultra") || normalizedCorpus.includes("ساعت اولترا") || normalizedCorpus.includes("اپل واچ"))) return true;
      if (pId.includes("ipad") && (normalizedCorpus.includes("ipad pro") || normalizedCorpus.includes("آیپد پرو") || normalizedCorpus.includes("تاندم اولد"))) return true;
      if (pId.includes("xdr") && (normalizedCorpus.includes("pro display") || normalizedCorpus.includes("6k") || normalizedCorpus.includes("xdr"))) return true;
      if (pId.includes("decklink") && (normalizedCorpus.includes("decklink") || normalizedCorpus.includes("کارت کپچر") || normalizedCorpus.includes("بلک مجیک"))) return true;
      if (pId.includes("calibrite") && (normalizedCorpus.includes("calibrite") || normalizedCorpus.includes("کالیبرایت") || normalizedCorpus.includes("کالیبراتور"))) return true;

      return false;
    });

    if (!matchedProduct && (normalizedCorpus.includes("استودیو") || normalizedCorpus.includes("5k"))) {
      matchedProduct = products.find((p) => String(p.id).includes("studio-display")) || products[3];
    }

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
