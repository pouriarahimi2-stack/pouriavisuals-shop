import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic  = "force-dynamic";
export const maxDuration = 30;

// مدل‌های Gemini به ترتیب اولویت
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-pro",
];

async function callGemini(apiKey: string, prompt: string, system: string): Promise<string | null> {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents:           [{ parts: [{ text: prompt }] }],
            generationConfig:   { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body   = await req.json();
    const prompt = String(body.prompt || body.message || "").trim();
    if (!prompt) return NextResponse.json({ success: false, message: "پرامپت خالی است." }, { status: 400 });

    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const { data } = await supabaseAdmin.from("site_info").select("gemini_api_key").limit(1).maybeSingle();
      apiKey = data?.gemini_api_key || "";
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "کلید Gemini API تنظیم نشده. از بخش مرکز هوش مصنوعی وارد کنید." }, { status: 400 });
    }

    const system = "شما دستیار هوشمند فروشگاه آنلاین آکسون کور هستید — فروشگاه تخصصی محصولات تکنولوژی در ایران. پاسخ‌ها به فارسی روان، کاربردی و متناسب با بازار ایران. حداکثر ۵۰۰ کلمه.";
    const reply  = await callGemini(apiKey, prompt, system);

    if (!reply) {
      return NextResponse.json({ success: false, message: "خطا در ارتباط با Gemini API. کلید را بررسی کنید." }, { status: 500 });
    }

    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
