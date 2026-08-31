import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const imageBase64 = body.imageBase64 || null;

    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, title, name, price, discount_price, category, stock, is_available, description, specs, images");

    const products = dbProducts && dbProducts.length > 0 ? dbProducts : [];

    const productCatalog = products.map((p: any) =>
      `• [شناسه: ${p.id}] ${p.title || p.name} | دسته: ${p.category} | قیمت: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 0} عدد`
    ).join("\n");

    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDummy";
    let aiResponse = "";
    let matchedProduct: any = null;

    // جستجوی نزدیک‌ترین کالا
    const lower = userMessage.toLowerCase();
    const found = products.find((p: any) =>
      (p.title && lower.includes(p.title.toLowerCase())) ||
      (p.name && lower.includes(p.name.toLowerCase())) ||
      (p.category && lower.includes(p.category.toLowerCase()))
    );

    if (found) matchedProduct = found;

    if (apiKey && apiKey.length > 15) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptText = `تو مهندس ارشد و مشاور تخصصی فروشگاه آکسون (مرجع تخصصی مانیتورهای ۵K، لپ‌تاپ‌های تدوین و گجت‌های استودیو) هستی.
به زبان فارسی کاملاً تخصصی، موشکافانه، مودبانه و مستدل به کاربر پاسخ بده.

کاتالوگ محصولات موجود در انبار فروشگاه:
${productCatalog}

پرسش کاربر:
${userMessage}

اگر کاربر تصویری فرستاده است، دقیقاً قطعه، مانیتور یا دستگاه موجود در تصویر را شناسایی، کالبدشکافی و تحلیل کن و در صورتی که در کاتالوگ فروشگاه موجود است آن را صراحتاً معرفی کن.`;

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
        console.warn("Gemini Live Call warning:", err);
      }
    }

    if (!aiResponse) {
      if (matchedProduct) {
        aiResponse = `درود بر شما! با توجه به نیاز تخصصی شما، محصول **«${matchedProduct.title || matchedProduct.name}»** در دسته **${matchedProduct.category}** با قیمت ویژه **${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان** در فروشگاه موجود است.\n\nاین دستگاه دارای کالیبراسیون سخت‌افزاری کارخانه، تفکیک رنگ فوق‌العاده و گارانتی اصالت طلایی آکسون می‌باشد.`;
      } else {
        aiResponse = `درود بر شما! من مشاور هوشمند و مهندس سخت‌افزار آکسون هستم. در زمینه انتخاب مانیتورهای 5K رتینا، کالیبراتورهای رنگی، کارت‌های کپچر 8K و لپ‌تاپ‌های تدوین در خدمت شما هستم. لطفاً سوال فنی خود را مطرح کنید یا عکس دستگاه را برای بررسی ارسال فرمایید.`;
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      reply: aiResponse,
      matchedProduct: matchedProduct ? {
        id: matchedProduct.id,
        title: matchedProduct.title || matchedProduct.name,
        price: matchedProduct.price,
        discount_price: matchedProduct.discount_price,
        image: matchedProduct.images?.[0] || matchedProduct.image || ""
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
