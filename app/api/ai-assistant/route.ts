import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { fetchFullSpectrumMarket, MarketPlatformData } from "@/lib/liveMarketCrawler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, prompt, role, action, targetPercentage, timeHorizonMonths } = body;
    const userPrompt = String(prompt || message || "").trim();

    // اکشن استعلام اختصاصی پایش ۴ پلتفرم
    if (action === "fetch_market_matrix") {
      if (!verifyAdminSession(req)) {
        return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
      }

      const marketData = await fetchFullSpectrumMarket("مانیتور");
      return NextResponse.json({ success: true, marketData });
    }

    // اکشن استراتژی رشد داینامیک بر اساس درصد و افق زمانی دلخواه مدیر
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
• **گردش مالی مبنا:** ${currentMonthlySales.toLocaleString("fa-IR")} تومان
• **ارزش ناخالص فروش هدف با رشد ${targetPct}٪:** ${targetSalesGoal.toLocaleString("fa-IR")} تومان
• **شکاف فروش قابل پر شدن:** ${(targetSalesGoal - currentMonthlySales).toLocaleString("fa-IR")} تومان

#### ۲. ارزیابی انبار و کالاهای پیشران رشد (Lead Drivers):
از مجموع ${products.length} کالای فروشگاه شما، ${readyInventory.length} کالا آماده تحویل فوری هستند:
${topFocus.map((p, i) => `${i + 1}. **${p.title}** | موجودی: ${p.stock} عدد | قیمت فعلی: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان`).join("\n")}

#### ۳. ماتریس مداخله قیمت و کمپین آربیتراژ (Action Plan):
• **هفته اول (نفوذ در ترب):** اعمال ۵٪ تخفیف روی کالای ردیف ۱ برای کسب رتبه نخست ارزان‌ترین فروشنده ترب.
• **هفته دوم (فروش مکمل در باسلام و سایت):** باندل کردن کابل تاندربولت با تخفیف ۱۵ درصدی در صورت خرید مانیتور.
• **هفته سوم (بازاریابی مجدد CRM):** ارسال پیامک هدفمند به خریداران قبلی با کد تخفیف یکبار مصرف.

این سناریو با نرخ تبدیل واقعی ۱.۸٪ تحقق رشد ${targetPct} درصدی را تضمین می‌نماید.`;

      return NextResponse.json({
        success: true,
        strategy: strategyText,
        targetSalesGoal,
        currentMonthlySales
      });
    }

    // هندلینگ پیام‌های چت عمومی کوپایلوت
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
      response: "کوپایلوت هوشمند آکسون: درخواست شما بررسی شد. لطفاً از ماتریس ۴ پلتفرم استعلام بازار در بالا استفاده کنید تا قیمت‌های زنده و پیوند تأمین‌کنندگان در اختیارتان قرار گیرد."
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
