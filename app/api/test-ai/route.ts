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

    // مدل‌های دارای سهمیه رایگان و فعال گوگل به ترتیب اولویت
    const candidateModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-8b",
      "gemini-pro"
    ];

    let reply = "";
    let activeModelName = "";
    let lastErrorMsg = "";

    for (const mName of candidateModels) {
      try {
        const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${cleanKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": cleanKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "سلام! یک کلمه بگو: آماده‌ام" }] }],
          }),
        });

        const testJson = await testRes.json();

        if (testJson.error) {
          lastErrorMsg = testJson.error.message || "";
          continue; // در صورت سهمیه نداشتن یک مدل، فوراً مدل بعدی تست شود
        }

        const generatedText = testJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          reply = generatedText.trim();
          activeModelName = mName;
          break; // موفقیت!
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || "";
        continue;
      }
    }

    if (reply) {
      // ذخیره امن کلید تاییدشده در دیتابیس
      try {
        if (supabaseAdmin) {
          await supabaseAdmin.from("site_info").upsert({ id: 1, gemini_api_key: cleanKey }, { onConflict: "id" });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `✓ اتصال ۱۰۰٪ برقرار شد! پاسخ زنده هوش مصنوعی: "${reply}" (مدل فعال: ${activeModelName})`,
        activeModel: activeModelName,
      });
    }

    return NextResponse.json({
      success: false,
      message: `خطای گوگل: ${lastErrorMsg || "لطفاً اتصال اینترنت سرور یا کلید را بررسی فرمایید."}`
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطای سرور: ${err.message}` }, { status: 500 });
  }
}
