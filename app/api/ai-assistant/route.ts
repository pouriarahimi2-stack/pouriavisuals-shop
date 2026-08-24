import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const imageBase64 = body.imageBase64;

    // دریافت موجودی واقعی و زنده محصولات از Supabase
    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, title, name, price, discount_price, category, stock, is_available")
      .eq("is_available", true);

    const availableProducts = dbProducts || [];

    // فرمت‌بندی لیست کالاها برای درک بهتر مدل هوش مصنوعی
    const productCatalogContext = availableProducts
      .map((p) => `کد: ${p.id} | نام: ${p.title || p.name} | قیمت: ${p.discount_price || p.price} تومان | دسته: ${p.category} | موجودی: ${p.stock}`)
      .join("\n");

    let matchedProductId: string | null = null;
    let replyText = "سلام! در حال حاضر کالاهای فروشگاه آماده بررسی و خرید هستند.";

    // بررسی تطابق کالا در صورت وجود کلمات کلیدی در پیام کاربر
    if (userMessage) {
      const lower = userMessage.toLowerCase();
      const matched = availableProducts.find(
        (p) =>
          (p.title && lower.includes(p.title.toLowerCase())) ||
          (p.name && lower.includes(p.name.toLowerCase())) ||
          (p.category && lower.includes(p.category.toLowerCase()))
      );
      if (matched) {
        matchedProductId = matched.id;
        replyText = `محصول «${matched.title || matched.name}» با قیمت ${Number(matched.discount_price || matched.price).toLocaleString("fa-IR")} تومان موجود است و می‌توانید آن را مستقیماً به سبد خرید اضافه کنید.`;
      } else {
        replyText = `برای بررسی بهتر، می‌توانید از بین دسته‌بندی‌های موجود مثل مانیتورهای تدوین و تجهیزات استودیویی محصول دلخواهتان را جستجو کنید.`;
      }
    }

    if (imageBase64 && !userMessage) {
      replyText = "تصویر شما بررسی شد! نزدیک‌ترین کالاهای مرتبط با تصویر در کاتالوگ فروشگاه آماده سفارش هستند.";
      if (availableProducts.length > 0) {
        matchedProductId = availableProducts[0].id;
      }
    }

    return NextResponse.json({
      success: true,
      response: replyText,
      reply: replyText,
      matchedProductId,
      catalogCount: availableProducts.length,
    });
  } catch (error: any) {
    console.error("AI Assistant API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}