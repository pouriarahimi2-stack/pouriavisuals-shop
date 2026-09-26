import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic  = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body   = await req.json();
    const prompt = String(body.prompt || body.message || "").trim();
    if (!prompt) return NextResponse.json({ success: false, message: "پرامپت خالی است." }, { status: 400 });

    // کلید API از DB
    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key").limit(1).maybeSingle();
      apiKey = data?.gemini_api_key || "";
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "کلید Gemini API تنظیم نشده است. از صفحه مرکز هوش مصنوعی کلید را وارد کنید." }, { status: 400 });
    }

    const systemContext = `شما دستیار هوشمند فروشگاه آنلاین آکسون کور هستید — یک فروشگاه تخصصی محصولات تکنولوژی و دیجیتال در ایران.
پاسخ‌ها باید:
- به زبان فارسی روان و حرفه‌ای
- کاربردی و قابل اجرا
- متناسب با بازار ایران
- مختصر اما کامل (حداکثر ۵۰۰ کلمه)`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemContext }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "خطای API");

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "پاسخی دریافت نشد.";
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
