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

    const endpointsToTry = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    ];

    let reply = "";
    let successfulEndpoint = "";
    let lastErrorMsg = "";

    for (const ep of endpointsToTry) {
      try {
        const testRes = await fetch(`${ep}?key=${cleanKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": cleanKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "سلام! یک کلمه بگو: آماده‌ام" }] }],
          }),
        });

        const testJson = await testRes.json();

        if (testJson.error) {
          lastErrorMsg = testJson.error.message || "";
          continue;
        }

        const generatedText = testJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          reply = generatedText.trim();
          successfulEndpoint = ep.split("/models/")[1]?.split(":")[0] || "gemini-1.5-flash";
          break;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || "";
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
        message: `✓ اتصال ۱۰۰٪ برقرار شد! پاسخ هوش مصنوعی: "${reply}" (مدل فعال: ${successfulEndpoint})`,
        activeModel: successfulEndpoint,
      });
    }

    return NextResponse.json({
      success: false,
      message: `خطای گوگل: ${lastErrorMsg || "عدم دسترسی به مدل‌ها. لطفاً کلید API را بررسی فرمایید."}`
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطای سرور: ${err.message}` }, { status: 500 });
  }
}
