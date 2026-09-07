// File Path: app/api/ai-assistant/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";

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

function findBestMatchingProduct(corpus: string, productList: any[]): any {
  const normCorpus = normalizePersianText(corpus);
  let bestProduct: any = null;
  let highestScore = 0;

  for (const p of productList) {
    let score = 0;
    const pId = normalizePersianText(String(p.id || ''));
    const pTitle = normalizePersianText(String(p.title || p.name || ''));
    const pTitleFa = normalizePersianText(String(p.title_fa || ''));
    const pFull = `${pId} ${pTitle} ${pTitleFa}`;

    if (pId && normCorpus.includes(pId)) score += 50;
    if ((pFull.includes('studio') || pFull.includes('استودیو')) && (normCorpus.includes('studio') || normCorpus.includes('استودیو'))) score += 30;
    if ((pFull.includes('macbook') || pFull.includes('مک بوک')) && (normCorpus.includes('macbook') || normCorpus.includes('مک بوک'))) score += 30;
    if ((pFull.includes('watch') || pFull.includes('ساعت')) && (normCorpus.includes('watch') || normCorpus.includes('ساعت'))) score += 30;
    if ((pFull.includes('ipad') || pFull.includes('آیپد')) && (normCorpus.includes('ipad') || normCorpus.includes('آیپد'))) score += 30;

    if (score > highestScore) {
      highestScore = score;
      bestProduct = p;
    }
  }

  return bestProduct;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = String(body.message || body.prompt || "").trim();
    const imageBase64 = body.imageBase64 || null;

    if (!userMessage && !imageBase64) {
      return NextResponse.json({ success: false, message: "پیامی ارسال نشده است." }, { status: 400 });
    }

    let products = Array.isArray(FLAGSHIP_7_PRODUCTS) ? [...FLAGSHIP_7_PRODUCTS] : [];
    let siteInfoData: any = null;

    if (supabaseAdmin) {
      try {
        const [prodsRes, infoRes] = await Promise.all([
          supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle(),
        ]);
        if (prodsRes.data && prodsRes.data.length > 0) products = prodsRes.data;
        if (infoRes.data) siteInfoData = infoRes.data;
      } catch {}
    }

    const apiKey =
      siteInfoData?.gemini_api_key ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const storeName = siteInfoData?.site_name || siteInfoData?.store_name || "آکسون | Axon Tech";

    const productCatalogContext = products
      .map(
        (p: any) =>
          `• [شناسه: ${p.id}] نام: ${p.title || p.name} | قیمت: ${Number(p.discount_price || p.price || 0).toLocaleString("fa-IR")} تومان | دسته‌بندی: ${p.category || "تخصصی"}`
      )
      .join("\n");

    const systemInstruction = `تو مشاور هوشمند، مودب و مهندس ارشد پلتفرم ${storeName} هستی.
اگر کاربر درباره قیمت یا کلمه «چنده» سوال کرد، قیمت دقیق و به روز کالا را با احترام اعلام کن.
تمامی کالاها دارای ۱۸ ماه گارانتی اصالت طلایی و ارسال رایگان پیشتاز هستند.
کاتالوگ کالاها:\n${productCatalogContext}`;

    let aiResponse = "";
    const cleanKey = apiKey ? String(apiKey).trim() : "";

    if (cleanKey && cleanKey.length > 15) {
      const endpoints = [
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      ];

      for (const ep of endpoints) {
        try {
          const parts: any[] = [{ text: `${systemInstruction}\n\n[پیام کاربر]: ${userMessage}` }];
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
          }

          const geminiRes = await fetch(`${ep}?key=${cleanKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
            body: JSON.stringify({ contents: [{ parts }] }),
          });

          const geminiJson = await geminiRes.json();
          if (geminiJson.error) continue;

          const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            aiResponse = text;
            break;
          }
        } catch {}
      }
    }

    const normalizedMsg = normalizePersianText(userMessage);

    if (!aiResponse) {
      if (normalizedMsg.includes("studio") || normalizedMsg.includes("استودیو") || normalizedMsg.includes("5k")) {
        aiResponse = "مانیتور پرچمدار **Apple Studio Display 27 اینچ 5K Retina** با شیشه مات نانوتکستچر و کالیبراسیون سخت‌افزاری با قیمت رسمی ۱۲۸,۵۰۰,۰۰۰ تومان و ۱۸ ماه گارانتی اصالت طلایی آکسون در انبار موجود است. 🖥️✨";
      } else if (normalizedMsg.includes("مک بوک") || normalizedMsg.includes("macbook")) {
        aiResponse = "لپ‌تاپ قدرتمند **MacBook Pro 16 اینچ با تراشه M4 Max**، رم ۱۲۸ گیگابایت و ۲ ترابایت SSD با قیمت ۲۰۸,۵۰۰,۰۰۰ تومان و گارانتی طلایی آماده تحویل فوری است. 💻⚡";
      } else {
        aiResponse = `سلام و درود! من مشاور هوشمند تجهیزات تصویر و دیجیتال در ${storeName} هستم. چطور می‌توانم در انتخاب سخت‌افزار کمکتان کنم؟`;
      }
    }

    const matchedProduct = findBestMatchingProduct(aiResponse + " " + userMessage, products);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      matchedProduct: matchedProduct
        ? {
            id: String(matchedProduct.id),
            title: matchedProduct.title || matchedProduct.name,
            price: Number(matchedProduct.discount_price || matchedProduct.discountPrice || matchedProduct.price || 0),
            image: matchedProduct.images?.[0] || matchedProduct.image || "/placeholder.png",
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      response: "درود بر شما! در خدمتتان هستم، بفرمایید چه کمکی از دست من برمی‌آید؟",
      matchedProduct: null,
    });
  }
}
