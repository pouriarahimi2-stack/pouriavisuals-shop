import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "کلید GEMINI_API_KEY در متغیرهای سرور یافت نشد." }, { status: 400 });
    }

    const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "سلام! یک کلمه بگو: فعال" }] }],
      }),
    });

    const testJson = await testRes.json();
    if (testJson.error) {
      return NextResponse.json({ success: false, message: testJson.error.message || "خطا در مدل گوگل." }, { status: 400 });
    }

    const text = testJson.candidates?.[0]?.content?.parts?.[0]?.text || "آماده";
    return NextResponse.json({
      success: true,
      message: `✓ اتصال برقرار شد! پاسخ هوش مصنوعی: "${text.trim()}"`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
