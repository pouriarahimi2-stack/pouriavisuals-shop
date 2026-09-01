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
وظیفه تو گفتگوی فوق‌العاده صمیمی، محاوره‌ای، روان و کاملاً تخصصی با کاربران در تمامی حوزه‌های تکنولوژی، سخت‌افزار، گجت‌ها، هوش مصنوعی، لپ‌تاپ‌ها و لوازم دیجیتال است.

قوانین گفتگو:
۱. در خصوص هر حوزه از تکنولوژی که کاربر سوال کرد، با اطلاعات به‌روز و جذاب پاسخ بده.
۲. اگر کاربر درباره محصول یا برندی پرسید که در کاتالوگ نیست، با احترام توضیح بده و بهترین گزینه‌های پیشرفته معادل موجود در فروشگاه را معرفی کن.
۳. متن پاسخ‌هایت باید بدون تگ‌های نامناسب و به زبان فارسی شیوا و امروزی باشد.
۴. شماره پشتیبانی استودیو: ${storePhone}

کاتالوگ محصولات موجود در انبار:
${productCatalogContext}`;

    let aiResponse = "";
    const cleanKey = apiKey ? String(apiKey).trim() : "";

    if (cleanKey && cleanKey.length > 15) {
      try {
        // استعلام مدل فعال از گوگل
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
          headers: { "x-goog-api-key": cleanKey }
        });
        const listData = await listRes.json();
        const available = listData.models?.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent")) || [];
        
        const preferred = available.find((m: any) => m.name.includes("1.5-flash") || m.name.includes("2.0-flash") || m.name.includes("1.5-pro") || m.name.includes("gemini-pro")) || available[0];
        const targetModel = preferred ? preferred.name : "models/gemini-1.5-flash";

        const parts: any[] = [{ text: `${systemInstruction}\n\n[پیام کاربر]: ${userMessage}` }];
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
        }

        const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${cleanKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": cleanKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
          }),
        });

        const genJson = await genRes.json();
        const text = genJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) aiResponse = text;
      } catch (err) {
        console.warn("Gemini execution error:", err);
      }
    }

    if (!aiResponse) {
      aiResponse = `سلام و درود! من دستیار هوشمند و مشاور تکنولوژی فروشگاه ${storeName} هستم. چطور می‌توانم در زمینه گجت‌ها، سخت‌افزارها و انتخاب بهترین دستگاه راهنماییتان کنم؟`;
    }

    // یافتن محصول مرتبط
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
