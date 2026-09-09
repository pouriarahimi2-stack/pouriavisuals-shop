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

    if (action === "fetch_market_matrix") {
      if (!verifyAdminSession(req)) {
        return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
      }

      const queryToSearch = String(customKeyword || "").trim() || "پاور بانک";
      const marketData = await fetchFullSpectrumMarket(queryToSearch);
      return NextResponse.json({ success: true, marketData, searchedKeyword: queryToSearch });
    }

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

      const strategyText = `### 🚀 برنامه راهبردی رشد ${targetPct} درصدی فروش در بازه ${months} ماهه

#### ۱. تحلیل پایه‌ای تراز مالی:
• **فروش مبنا:** ${currentMonthlySales.toLocaleString("fa-IR")} تومان
• **فروش هدف با رشد ${targetPct}٪:** ${targetSalesGoal.toLocaleString("fa-IR")} تومان
• **شکاف قابل پر شدن:** ${(targetSalesGoal - currentMonthlySales).toLocaleString("fa-IR")} تومان

#### ۲. کالاهای پیشران موجود در انبار:
${topFocus.map((p, i) => `${i + 1}. **${p.title}** | موجودی: ${p.stock} عدد | قیمت فعلی: ${Number(p.discount_price || p.price).toLocaleString("fa-IR")} تومان`).join("\n")}

#### ۳. برنامه اقدام:
• کاهش ۲ الی ۵ درصدی قیمت روی کالای پیشران اول جهت کسب رتبه ۱ ارزان‌ترین فروشنده در ترب.
• باندلینگ با حاشیه سود مناسب و ارسال پیامک از طریق CRM.`;

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
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: userPrompt }] }] })
        });

        const json = await geminiRes.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return NextResponse.json({ success: true, response: text });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      response: "کوپایلوت هوشمند آکسون: درخواست دریافت شد. از ماتریس استعلام ۵ پلتفرم برای ورود مستقیم به پنل تأمین‌کنندگان استفاده کنید."
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
