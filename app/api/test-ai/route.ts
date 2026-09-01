// File Path: app/api/test-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    let targetKey = apiKey;
    if (!targetKey) {
      try {
        const { data } = await supabaseAdmin.from("site_info").select("*").limit(1).maybeSingle();
        targetKey = (data as any)?.gemini_api_key || process.env.GEMINI_API_KEY;
      } catch {}
    }

    if (!targetKey || targetKey.length < 15) {
      return NextResponse.json({ success: false, message: "کلید API وارد نشده یا معتبر نیست." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(targetKey.trim());
    const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-pro"];
    let reply = "";
    let activeModelName = "";

    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: mName });
        const result = await model.generateContent("سلام! یک پاسخ کوتاه ۲ کلمه‌ای به فارسی بده.");
        reply = result.response.text();
        if (reply) {
          activeModelName = mName;
          break;
        }
      } catch (err: any) {
        console.warn(`Test model ${mName} failed:`, err?.message);
      }
    }

    if (reply) {
      return NextResponse.json({
        success: true,
        message: `اتصال با موفقیت برقرار شد! پاسخ هوش مصنوعی: "${reply.trim()}" (مدل فعال: ${activeModelName})`,
        activeModel: activeModelName,
      });
    }

    return NextResponse.json({ success: false, message: "خطا در اتصال به گوگل. کلید یا سهمیه پروژه را بررسی فرمایید." }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطای اعتبارسنجی: ${err.message}` }, { status: 500 });
  }
}
