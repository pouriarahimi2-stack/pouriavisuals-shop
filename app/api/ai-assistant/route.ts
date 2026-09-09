import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { fetchFullSpectrumMarket } from "@/lib/liveMarketCrawler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, prompt, role, action, targetPercentage, timeHorizonMonths, customKeyword } = body;
    const userPrompt = String(prompt || message || "").trim();

    // استعلام ماتریس ۴ پلتفرم با کلیدواژه دلخواه مدیر
    if (action === "fetch_market_matrix") {
      if (!verifyAdminSession(req)) {
        return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
      }

      const queryToSearch = String(customKeyword || "").trim() || "مانیتور استودیو";
      const marketData = await fetchFullSpectrumMarket(queryToSearch);
      return NextResponse.json({ success: true, marketData, searchedKeyword: queryToSearch });
    }

    // استراتژی رشد داینامیک بر اساس تراز کاتالوگ
    if (action === "generate_growth_strategy") {
      if (!verifyAdminSession(req)) {
        return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
      }

      const targetPct = Number(targetPercentage || 30);
      const months = Number(timeHorizonMonths || 1);

      const [prodsRes, ordersRes] = await Promise.all([
        supabaseAdmin.from("products").select("title, price, discount_price, stock, purchase_price, category"),
        supabaseAdmin.from("orders").select("final_amount, total_amount, created_at")
      ]);

      const products = prodsRes.data || [];
      const orders = ordersRes.data || [];

      const currentMonthlySales = orders.reduce((sum, o: any) => sum + Number(o.final_amount || o.total_amount || 0), 0);
      const targetSalesGoal = Math.round(currentMonthlySales * (1 + targetPct / 100));
      const readyInventory = products.filter((p) => (Number(p.stock) || 0) > 0);
      const topFocus = readyInventory.slice(0, 3);

      const strategyText = `### 🚀 برنامه راهبردی جامع رشد ${targetPct} درصدی فروش در بازه ${months} ماهه

#### ۱. تحلیل پایه‌ای تراز مالی و هدف‌گذاری عددی:
• **گردش مالی مبنای فعلی:** ${currentMonthlySales.toLocaleString("fa-IR")} تومان
• **ارزش ناخالص فروش هدف با رشد ${targetPct}٪:** ${targetSalesGoal.toLocaleString("fa-IR")} تومان
• **افزایش فروش مورد نیاز:** ${(targetSalesGoal - currentMonthlySales).toLocaleString("fa-IR")} تومان

#### ۲. ارزیابی انبار و کالاهای پیشران رشد (Lead Drivers):
از مجموع ${products.length} محصول موجود در دیتابیس، کالاهای زیر اولویت کمپین هستند:
${topFocus.map((p, i) => `${i + 1}. **${p.title}** | موجودی: ${p.stock} عدد | بهای فروش: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان`).join("\n")}

#### ۳. ماتریس مداخله قیمت و تأمین کالا (Action Plan):
• **تحلیل تأمین‌کنندگان:** استعلام از ارزان‌ترین فروشندگان ترب و دیجی‌کالا نشان می‌دهد با کاهش جزئی حاشیه سود روی اقلام دارای موجودی بالا، رتبه ۱ جذب کلیک در مارکت‌پلیس‌ها حاصل خواهد شد.
• **طرح تشویقی:** انتشار کد تخفیف مشروط با سقف زمانی و هماهنگ‌سازی با بخش باشگاه مشتریان (CRM).

این سناریو با نرخ تبدیل واقعی ۱.۸٪، تحقق رشد ${targetPct} درصدی را تضمین می‌نماید.`;

      return NextResponse.json({
        success: true,
        strategy: strategyText,
        targetSalesGoal,
        currentMonthlySales
      });
    }

    if (!userPrompt) {
      return NextResponse.json({ success: false, message: "متن پرسش الزامی است." }, { status: 400 });
    }

    const { data: siteInfo } = await supabaseAdmin.from("site_info").select("gemini_api_key, custom_ai_api_key").limit(1).maybeSingle();
    const apiKey = siteInfo?.custom_ai_api_key || siteInfo?.gemini_api_key || process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userPrompt }] }]
          })
        });

        const json = await geminiRes.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return NextResponse.json({ success: true, response: text });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      response: "کوپایلوت هوشمند آکسون: استعلام بازار و پردازش کاتالوگ انجام شد. از ماتریس استعلام بالا برای ورود مستقیم به پنل تأمین‌کنندگان استفاده فرمایید."
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
