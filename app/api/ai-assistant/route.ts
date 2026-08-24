import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";
    const role = body.role || "customer"; // 'admin' | 'customer'
    const imageBase64 = body.imageBase64;

    // دریافت داده‌های لایو فروشگاه جهت تزریق به کانتکست هوش مصنوعی
    const [productsRes, ordersRes, postsRes, siteInfoRes] = await Promise.all([
      supabase.from("products").select("id, title, price, discount_price, stock, category, is_available"),
      supabase.from("orders").select("id, total_amount, status, created_at").limit(10),
      supabase.from("posts").select("id, title, category").limit(5),
      supabase.from("site_info").select("site_name, tagline, phone").limit(1).maybeSingle(),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const siteInfo = siteInfoRes.data || {};

    if (role === "admin") {
      const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
      const lowStockCount = products.filter((p) => (p.stock || 0) < 3).length;

      let adminReply = `درود مدیر گرامی. سیستم هوشمند فروشگاه ${siteInfo.site_name || "آکسون"} آماده همراهی شماست.\n`;
      
      const q = userMessage.toLowerCase();
      if (q.includes("وضعیت") || q.includes("گزارش") || q.includes("فروش")) {
        adminReply += `📊 **خلاصه وضعیت فعلی فروشگاه:**\n- تعداد کل محصولات: ${products.length} کالا\n- محصولات با موجودی بحرانی: ${lowStockCount} مورد\n- مجموع فروش اخیر: ${totalRevenue.toLocaleString("fa-IR")} تومان\n- سفارشات جدید نیازمند ارسال: ${orders.filter((o) => o.status === "paid").length} سفارش`;
      } else if (q.includes("سئو") || q.includes("مقاله") || q.includes("پیشنهاد")) {
        adminReply += `💡 **پیشنهاد بهینه‌سازی سئو:**\nبا توجه به دسته‌بندی مانیتورهای تدوین و کالرگریدینگ، نوشتن مقالاتی با کلمات کلیدی «کالیبراسیون سخت‌افزاری مانیتور» و «تفاوت پنل IPS و OLED برای اصلاح رنگ» ورودی ارگانیک شما را تا ۴۰٪ افزایش خواهد داد.`;
      } else {
        adminReply += `من می‌توانم در تحلیل کمپین‌های تخفیف، نگارش توضیحات جذاب برای محصولات جدید، و پایش سفارشات و وضعیت پستی به شما کمک کنم. چه فرمانی مد نظر دارید؟`;
      }

      return NextResponse.json({
        success: true,
        response: adminReply,
        reply: adminReply,
      });
    }

    // پاسخ‌دهی به مشتریان عادی در فروشگاه
    let matchedProductId: string | null = null;
    let customerReply = "سلام! برای خرید و مشاوره تجهیزات استودیویی و مانیتور در خدمت شما هستم.";

    if (userMessage) {
      const q = userMessage.toLowerCase();
      const matched = products.find(
        (p) =>
          (p.title && q.includes(p.title.toLowerCase())) ||
          (p.category && q.includes(p.category.toLowerCase()))
      );
      if (matched) {
        matchedProductId = matched.id;
        customerReply = `محصول «${matched.title}» با قیمت ${Number(matched.discount_price || matched.price).toLocaleString("fa-IR")} تومان موجود است و مستقیماً می‌توانید آن را سفارش دهید.`;
      }
    }

    return NextResponse.json({
      success: true,
      response: customerReply,
      reply: customerReply,
      matchedProductId,
    });
  } catch (error: any) {
    console.error("AI Assistant Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}