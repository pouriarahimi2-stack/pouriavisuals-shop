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

    // ۱. استعلام خودکار لیست مدل‌های فعال اختصاصی اکانت شما از سرور گوگل
    let selectedModel = "gemini-1.5-flash-latest";
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
        headers: { "x-goog-api-key": cleanKey }
      });
      const listData = await listRes.json();

      if (listData.models && Array.isArray(listData.models)) {
        const supported = listData.models.filter((m: any) =>
          m.supportedGenerationMethods?.includes("generateContent")
        );
        if (supported.length > 0) {
          const preferred = supported.find((m: any) => m.name.includes("1.5-pro") || m.name.includes("1.5-flash") || m.name.includes("gemini-2.0") || m.name.includes("gemini-pro"));
          selectedModel = preferred ? preferred.name.replace("models/", "") : supported[0].name.replace("models/", "");
        }
      }
    } catch (e) {
      console.warn("Auto-discovery fallback to default models:", e);
    }

    // ۲. ارسال درخواست تستی به گوگل
    const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${cleanKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": cleanKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "سلام! یک پاسخ کوتاه بگو: آماده‌ام برای پاسخگویی در فروشگاه آکسون." }] }],
      }),
    });

    const testJson = await testRes.json();
    const generatedText = testJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      // ذخیره امن کلید فعال در دیتابیس
      try {
        if (supabaseAdmin) {
          await supabaseAdmin.from("site_info").upsert({ id: 1, gemini_api_key: cleanKey }, { onConflict: "id" });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `✓ اتصال با موفقیت برقرار شد! پاسخ زنده هوش مصنوعی: "${generatedText.trim()}" (مدل متصل: ${selectedModel})`,
        activeModel: selectedModel,
      });
    }

    const errDetail = testJson.error?.message || "خطا در برقراری ارتباط با گوگل";
    return NextResponse.json({ success: false, message: `پاسخ سرور گوگل: ${errDetail}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطای اعتبارسنجی: ${err.message}` }, { status: 500 });
  }
}
