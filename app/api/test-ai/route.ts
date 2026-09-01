// File Path: app/api/test-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const cleanKey = String(apiKey || "").trim();

    if (!cleanKey) {
      return NextResponse.json({ success: false, message: "کادر کلید API خالی است." }, { status: 400 });
    }

    // اولویت قطعی با مدل‌های پرسرعت و دارای سهمیه باز روی تمام اکانت‌ها
    const priorityModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    let reply = "";
    let activeModelName = "";
    let lastError = "";

    for (const mName of priorityModels) {
      try {
        const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${cleanKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": cleanKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "سلام! یک پاسخ کوتاه بگو: آماده‌ام" }] }],
          }),
        });

        const testJson = await testRes.json();

        if (testJson.error) {
          lastError = testJson.error.message || "";
          continue; // در صورت سهمیه نداشتن این مدل خاص، بلافاصله مدل بعدی تست شود
        }

        const generatedText = testJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          reply = generatedText.trim();
          activeModelName = mName;
          break; // موفقیت قطعی!
        }
      } catch (err: any) {
        lastError = err?.message || "";
        continue;
      }
    }

    if (reply) {
      try {
        if (supabaseAdmin) {
          await supabaseAdmin.from("site_info").upsert({ id: 1, gemini_api_key: cleanKey }, { onConflict: "id" });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `✓ اتصال ۱۰۰٪ برقرار شد! پاسخ هوش مصنوعی: "${reply}" (مدل فعال: ${activeModelName})`,
        activeModel: activeModelName,
      });
    }

    return NextResponse.json({
      success: false,
      message: `خطای گوگل: ${lastError || "کلید معتبر نیست یا سهمیه پروژه به اتمام رسیده است."}`
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطای سرور: ${err.message}` }, { status: 500 });
  }
}
