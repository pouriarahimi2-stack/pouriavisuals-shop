import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const imageBase64 = body.imageBase64 || null;

    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, title, name, price, discount_price, category, stock, is_available, description, specs, images");

    const productCatalog = (products || []).map((p: any) =>
      `• [شناسه: ${p.id}] ${p.title || p.name} | دسته: ${p.category} | قیمت: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان | موجودی: ${p.stock ?? 0} عدد`
    ).join("\n");

    let aiResponse = "";
    let matchedProduct: any = null;

    // جستجوی نزدیک‌ترین کالا در کاتالوگ
    const lowerQuery = userMessage.toLowerCase();
    const matched = (products || []).find((p: any) =>
      (p.title && lowerQuery.includes(p.title.toLowerCase())) ||
      (p.name && lowerQuery.includes(p.name.toLowerCase())) ||
      (p.category && lowerQuery.includes(p.category.toLowerCase()))
    );

    if (matched) matchedProduct = matched;

    const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyDummy";

    if (geminiKey && geminiKey.length > 15) {
      try {
        const parts: any[] = [];
        if (imageBase64) {
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inline_data: { mime_type: "image/jpeg", data: base64Data }
          });
        }

        const promptWithContext = `تو مهندس ارشد و مشاور تخصصی فروشگاه آکسون (مرجع مانیتورهای ۵K، لپ‌تاپ‌های تدوین و گجت‌های استودیو) هستی.
به زبان فارسی تخصصی، روان و مستدل به کاربر پاسخ بده.

کاتالوگ محصولات فروشگاه:
${productCatalog}

پرسش کاربر:
${userMessage}

اگر کاربر عکس ارسال کرده، دستگاه یا قطعه را شناسایی و بررسی کن و دقیق‌ترین پیشنهاد را از کاتالوگ فروشگاه بده.`;

        parts.push({ text: promptWithContext });

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts }] }),
          }
        );

        const geminiJson = await geminiRes.json();
        aiResponse = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (e) {
        console.warn("Gemini Vision AI fallback:", e);
      }
    }

    if (!aiResponse) {
      if (matchedProduct) {
        aiResponse = `درود بر شما! با توجه به نیاز شما، کالای **«${matchedProduct.title || matchedProduct.name}»** با قیمت ویژه **${Number(matchedProduct.discount_price || matchedProduct.price).toLocaleString("fa-IR")} تومان** و گارانتی اصالت طلایی در فروشگاه موجود است.\n\nاین دستگاه دارای کالیبراسیون سخت‌افزاری دقیق، تفکیک رنگ ۱۰ بیتی و ساختار ماژولار است که بالاترین کارایی را برای شما فراهم می‌کند.`;
      } else {
        aiResponse = `درود! من دستیار هوشمند و مشاور تخصصی آکسون هستم. در زمینه مانیتورهای تدوین رنگ 5K، کالیبراتورها، کارت‌های کپچر و مک‌بوک‌های ورک‌استیشن در خدمت شما هستم. می‌توانید سوال تخصصی خود را بپرسید یا عکس قطعه را برای بررسی بفرستید.`;
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
        image: matchedProduct.images?.[0] || ""
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
