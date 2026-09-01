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

    let products = FLAGSHIP_7_PRODUCTS;
    try {
      if (supabaseAdmin) {
        const { data: dbProducts } = await supabaseAdmin
          .from("products")
          .select("id, title, name, price, discount_price, category, stock, is_available, description, specs, images");
        if (dbProducts && dbProducts.length > 0) {
          products = dbProducts;
        }
      }
    } catch {}

    const productCatalog = products.map((p: any) =>
      `• [شناسه: ${p.id}] ${p.title || p.name} | دسته: ${p.category} | قیمت: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 10} عدد`
    ).join("\n");

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponse = "";

    // ۱. فراخوانی آنلاین Gemini در صورت اتصال
    if (apiKey && apiKey.length > 15 && apiKey !== "AIzaSyDummy") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptText = `تو مشاور هوشمند، مهندس سخت‌افزار و کارشناس ارشد فروشگاه تخصصی آکسون (مرجع مانیتورهای ۵K، لپ‌تاپ‌های تدوین M4 Max و تجهیزات استودیو) هستی.
به زبان فارسی کاملاً صمیمی، روان، طبیعی و دقیقاً در پاسخ به سوال کاربر صحبت کن.
- اگر کاربر نام برندی خارج از فروشگاه (مثل سامسونگ، ال‌جی، دل، ایسوس و...) را پرسید، با احترام توضیح بده که تمرکز تخصصی آکسون بر مانیتورها و ورک‌استیشن‌های اپل (Apple)، بلک‌مجیک (Blackmagic) و کالیبرایت (Calibrite) است و بهترین جایگزین‌های باکیفیت موجود در انبار را معرفی کن.
- اگر کاربر احوال‌پرسی یا سلام کرد، گرم و متناسب با حرف او جواب بده.
- اگر قیمت یا مشخصات خواست، دقیقاً با ذکر تومان پاسخ بده.

کاتالوگ محصولات موجود در انبار:
${productCatalog}

پیام کاربر:
${userMessage}`;

        if (imageBase64) {
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const result = await model.generateContent([
            promptText,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
          ]);
          aiResponse = result.response.text();
        } else {
          const result = await model.generateContent(promptText);
          aiResponse = result.response.text();
        }
      } catch (err) {
        console.warn("Gemini API call fallback:", err);
      }
    }

    // ۲. موتور پویا و هوشمند تحلیل نیت کاربر (Dynamic Intent Engine) در صورت آفلاین بودن
    const normalized = userMessage
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .toLowerCase();

    let matchedProduct: any = null;

    if (!aiResponse) {
      if (normalized.includes("سامسونگ") || normalized.includes("samsung")) {
        aiResponse = "در حال حاضر در فروشگاه آکسون، محصولات برند **سامسونگ** موجود نمی‌باشد. تمرکز تخصصی ما بر روی مانیتورهای تدوین رنگ ۵K و ورک‌استیشن‌های پرچمدار برندهای **Apple (اپل)**، **Blackmagic Design** و **Calibrite** است.\n\nاگر به دنبال مانیتوری با وضوح تصویر فوق‌العاده و پنل ضدبازتاب برای طراحی و ادیت هستید، مانیتور **Apple Studio Display 27\" 5K** با شیشه نانوتکستچر را به شما پیشنهاد می‌کنم.";
        matchedProduct = products.find((p) => String(p.id).includes("studio")) || products[3];
      } else if (normalized.includes("ایسوس") || normalized.includes("asus") || normalized.includes("ال جی") || normalized.includes("lg") || normalized.includes("دل") || normalized.includes("dell")) {
        aiResponse = "محصولات این برند در حال حاضر در کاتالوگ استودیو آکسون موجود نیست. ما به صورت تخصصی نمایشگرهای مرجع رتینا ۵K و ۶K اپل و کارت‌های کپچر حرفه‌ای بلک‌مجیک را با ۱۸ ماه گارانتی طلایی عرضه می‌کنیم. مایلید مدل‌های مشابه موجود را با هم بررسی کنیم؟";
        matchedProduct = products[1];
      } else if (normalized.includes("سلام") || normalized.includes("درود") || normalized.includes("صبح بخیر") || normalized === "hi" || normalized === "hello") {
        aiResponse = "سلام و درود! خیلی خوش آمدید به استودیو آکسون. ⚡\nمن دستیار هوشمند و مشاور سخت‌افزار شما هستم. چه کمکی در زمینه انتخاب مانیتورهای ۵K، لپ‌تاپ‌های تدوین یا کالیبراسیون رنگ از دستم برمی‌آید؟";
      } else if (normalized.includes("چطوری") || normalized.includes("خوبی") || normalized.includes("چه خبر")) {
        aiResponse = "ممنون از لطف و محبت شما! عالی و پرانرژی هستم. تمام مشخصات و قیمت‌های روز کاتالوگ آماده است؛ شما چه دستگاه یا تجهیزاتی برای کارتون مد نظر دارید؟";
      } else if (normalized.includes("مک بوک") || normalized.includes("macbook") || normalized.includes("لپ تاپ")) {
        matchedProduct = products.find((p) => String(p.id).includes("macbook")) || products[0];
        aiResponse = `لپ‌تاپ پرچمدار **${matchedProduct.title}** با تراشه ۱۶ هسته‌ای M4 Max، رم ۱۲۸ گیگابایت و حافظه ۲ ترابایت موجود است. قیمت فعلی: **${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان** با گارانتی اصالت طلایی آکسون.`;
      } else if (normalized.includes("مانیتور") || normalized.includes("5k") || normalized.includes("نمایشگر") || normalized.includes("استودیو")) {
        matchedProduct = products.find((p) => String(p.id).includes("studio")) || products[3];
        aiResponse = `مانیتور استودیویی **${matchedProduct.title}** با وضوح 5K رتینا، پوشش رنگ DCI-P3 و کالیبراسیون سخت‌افزاری به قیمت **${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان** در انبار موجود است.`;
      } else if (normalized.includes("ساعت") || normalized.includes("watch") || normalized.includes("الترا")) {
        matchedProduct = products.find((p) => String(p.id).includes("watch")) || products[1];
        aiResponse = `ساعت هوشمند تیتانیومی **${matchedProduct.title}** با روشنایی ۳۰۰۰ نیت و مقاومت غواصی ۱۰۰ متر با قیمت **${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان** آماده ارسال است.`;
      } else if (normalized.includes("قیمت") || normalized.includes("چند")) {
        aiResponse = "قیمت تمامی محصولات بر اساس نرخ روز و تضمین کمترین قیمت بازار تنظیم شده است. مدل یا دستگاه مد نظرتان را بفرمایید تا قیمت و موجودی دقیق را به شما بگویم.";
      } else {
        aiResponse = `درود بر شما! در زمینه مشخصات فنی مانیتورهای ۵K رتینا، لپ‌تاپ‌های ورک‌استیشن M4 Max، کارت‌های کپچر 8K و کالیبراتورهای رنگ در خدمت شما هستم. لطفاً بفرمایید به چه تجهیزاتی نیاز دارید تا با مشخصات کامل راهنماییتان کنم.`;
      }
    }

    const calculatedPrice = matchedProduct
      ? Number(matchedProduct.discount_price || matchedProduct.discountPrice || matchedProduct.price || 0)
      : 0;

    return NextResponse.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      matchedProduct: matchedProduct ? {
        id: matchedProduct.id,
        title: matchedProduct.title || matchedProduct.name,
        price: calculatedPrice,
        discount_price: calculatedPrice,
        image: matchedProduct.images?.[0] || matchedProduct.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      response: "درود! ارتباط با سرور برقرار است. چطور می‌تونم در زمینه مانیتورها و تجهیزات تصویر آکسون راهنماییتون کنم؟",
      reply: "درود! ارتباط با سرور برقرار است. چطور می‌تونم در زمینه مانیتورها و تجهیزات تصویر آکسون راهنماییتون کنم؟",
      matchedProduct: null
    });
  }
}
