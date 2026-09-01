// File Path: app/api/ai-assistant/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

    // ۱. واکشی زنده کاتالوگ و مشخصات محصولات از پایگاه‌داده
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
    } catch (e) {
      console.warn("DB Context load warning:", e);
    }

    // استخراج کلید Gemini Pro از متغیرهای سرور یا پنل مدیریت
    const apiKey =
      process.env.GEMINI_API_KEY ||
      siteInfoData?.gemini_api_key ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const storeName = siteInfoData?.site_name || siteInfoData?.store_name || "آکسون | Axon";
    const storePhone = siteInfoData?.phone || "۰۲۱-۸۸۸۸۸۸۸۸";

    const productCatalogContext = products
      .map(
        (p: any) =>
          `• [شناسه کالا: ${p.id}] نام: ${p.title || p.name} | برند: ${p.brand || "Apple"} | دسته: ${p.category || "تجهیزات"} | قیمت با تخفیف: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 10} عدد | گارانتی: ${p.warranty || "۱۸ ماه گارانتی طلایی"} | مشخصات: ${JSON.stringify(p.specs || {})}`
      )
      .join("\n");

    let aiResponse = "";
    let matchedProduct: any = null;

    // ۲. اجرای مستقیم مدل رسمی Google Gemini 1.5
    if (apiKey && apiKey.length > 15 && apiKey !== "AIzaSyDummy") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // استفاده از مدل‌های مدرن 1.5 Flash یا 1.5 Pro
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 1500,
          },
        });

        const systemInstruction = `تو «مشاور هوشمند، مهندس ارشد سخت‌افزار و کارشناس تصویر فروشگاه ${storeName}» هستی.
وظیفه تو گفتگوی زنده، فوق‌العاده صمیمی، محترمانه، دقیق و طبیعی با کاربران به زبان فارسی است.

قوانین کاری تو:
۱. تو اشراف کامل به تمام کاتالوگ، انبار، قیمت‌ها و تجهیزات فروشگاه داری.
۲. اگر کاربر درباره هر برندی که در فروشگاه موجود نیست (مانند سامسونگ، ال‌جی، ایسوس، دل و...) سوال کرد، با کمال احترام و هوشمندی به او بگو که در حال حاضر در فروشگاه ${storeName} محصولات این برند موجود نیست و تمرکز تخصصی فروشگاه روی تجهیزات حرفه‌ای، مانیتورهای ۵K/6K و ورک‌استیشن‌های تدوین برندهای اپل (Apple)، بلک‌مجیک (Blackmagic) و کالیبرایت (Calibrite) است و با استدلال فنی بهترین گزینه‌های معادل موجود در کاتالوگ را به او پیشنهاد بده.
۳. اگر کاربر سلام، احوال‌پرسی یا گپ دوستانه زد، دقیقاً متناسب با لحن خودش خیلی گرم و پرانرژی جواب بده.
۴. اگر سوال فنی یا قیمت پرسید، مستدل، با جزئیات فنی و ذکر قیمت به تومان پاسخ بده.
۵. شماره تماس پشتیبانی فروشگاه: ${storePhone}

کاتالوگ کامل و زنده محصولات موجود در انبار:
${productCatalogContext}`;

        const fullPrompt = `${systemInstruction}\n\n[پیام کاربر]: ${userMessage}`;

        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const result = await model.generateContent([
            fullPrompt,
            { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
          ]);
          aiResponse = result.response.text();
        } else {
          const result = await model.generateContent(fullPrompt);
          aiResponse = result.response.text();
        }
      } catch (geminiError: any) {
        console.error("Gemini API Execution Error:", geminiError?.message || geminiError);
        aiResponse = `درود بر شما! درخواست شما دریافت شد، اما در برقراری ارتباط مستقیم با سرور هوش مصنوعی خطایی رخ داد (${geminiError?.message || "کلید نامعتبر یا محدودیت سهمیه"}). لطفاً کلید اکانت پرو Gemini خود را در تنظیمات ادمین وارد فرمایید.`;
      }
    } else {
      // در صورت نبود کلید API، پیام شفاف سیستمی (بدون هاردکد پاسخی فیک)
      aiResponse = `درود بر شما! من مشاور هوشمند فروشگاه ${storeName} هستم.
کلید هوش مصنوعی (GEMINI_API_KEY) هنوز در تنظیمات سرور یا پیشخوان ادمین فعال نشده است.
به محض وارد کردن کلید Gemini Pro در بخش «تنظیمات کلان سایت»، من با هوش کامل در خدمت شما خواهم بود!`;
    }

    // ۳. یافتن هوشمند محصول مرتبط از داخل پاسخ تولیدشده جهت پیوست کارت خرید
    const lowerResponse = (aiResponse + " " + userMessage).toLowerCase();
    matchedProduct = products.find((p: any) => {
      const t = (p.title || "").toLowerCase();
      const id = String(p.id).toLowerCase();
      return (
        lowerResponse.includes(id) ||
        (lowerResponse.includes("studio display") && id.includes("studio")) ||
        (lowerResponse.includes("xdr") && id.includes("xdr")) ||
        (lowerResponse.includes("macbook") && id.includes("macbook")) ||
        (lowerResponse.includes("watch") && id.includes("watch")) ||
        (lowerResponse.includes("ipad") && id.includes("ipad")) ||
        (lowerResponse.includes("decklink") && id.includes("decklink")) ||
        (lowerResponse.includes("calibrite") && id.includes("calibrite"))
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
      response: `خطای غیرمنتظره در پردازش هوش مصنوعی: ${error.message}`,
      reply: `خطای غیرمنتظره در پردازش هوش مصنوعی: ${error.message}`,
      matchedProduct: null,
    });
  }
}
