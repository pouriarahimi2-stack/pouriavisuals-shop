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

    // ۱. استعلام مستقیم لیست مدل‌های معتبر فعال روی اکانت شما
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
      headers: { "x-goog-api-key": cleanKey }
    });

    const listData = await listRes.json();

    if (listData.error) {
      return NextResponse.json({ success: false, message: `خطای اعتبارسنجی گوگل: ${listData.error.message}` }, { status: 400 });
    }

    const availableModels = listData.models?.filter((m: any) =>
      m.supportedGenerationMethods?.includes("generateContent")
    ) || [];

    if (availableModels.length === 0) {
      return NextResponse.json({ success: false, message: "هیچ مدلی برای این کلید یافت نشد. لطفاً دسترسی‌های پروژه در Google AI Studio را بررسی کنید." }, { status: 400 });
    }

    // انتخاب بهترین مدل فعال از روی لیست واقعی اکانت
    const preferredModel = availableModels.find((m: any) => m.name.includes("1.5-flash") || m.name.includes("2.0-flash") || m.name.includes("1.5-pro") || m.name.includes("gemini-pro")) || availableModels[0];
    const targetModelPath = preferredModel.name; // مثل models/gemini-1.5-flash

    // ۲. ارسال پیام تستی به مدل تاییدشده
    const generateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModelPath}:generateContent?key=${cleanKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": cleanKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "سلام! یک پاسخ کوتاه بگو: آماده‌ام" }] }],
      }),
    });

    const genJson = await generateRes.json();

    if (genJson.error) {
      return NextResponse.json({ success: false, message: `خطای مدل: ${genJson.error.message}` }, { status: 400 });
    }

    const reply = genJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      try {
        if (supabaseAdmin) {
          await supabaseAdmin.from("site_info").upsert({ id: 1, gemini_api_key: cleanKey }, { onConflict: "id" });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `✓ اتصال ۱۰۰٪ برقرار شد! پاسخ هوش مصنوعی: "${reply.trim()}" (مدل فعال: ${targetModelPath.replace("models/", "")})`,
        activeModel: targetModelPath.replace("models/", ""),
      });
    }

    return NextResponse.json({ success: false, message: "پاسخی از مدل دریافت نشد." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطای سرور: ${err.message}` }, { status: 500 });
  }
}
