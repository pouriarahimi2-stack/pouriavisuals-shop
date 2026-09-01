// File Path: app/api/test-ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const cleanKey = String(apiKey || "").trim();

    if (!cleanKey) {
      return NextResponse.json({ success: false, message: "کادر کلید API خالی است." }, { status: 400 });
    }

    if (!cleanKey.startsWith("AIzaSy")) {
      return NextResponse.json({
        success: false,
        message: "⚠️ فرمت کلید نامعتبر است! کلید رسمی گوگل باید با حروف AIzaSy شروع شود. لطفاً آن را از تب Google AI Studio کپی نمایید."
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(cleanKey);
    const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash", "gemini-pro"];
    let reply = "";
    let activeModel = "";

    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: mName });
        const result = await model.generateContent("سلام! یک کلمه بگو: آماده‌ام");
        reply = result.response.text();
        if (reply) {
          activeModel = mName;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${mName} error:`, err?.message);
      }
    }

    if (reply) {
      return NextResponse.json({
        success: true,
        message: `✓ اتصال با موفقیت برقرار شد! پاسخ هوش مصنوعی: "${reply.trim()}" (مدل فعال: ${activeModel})`,
        activeModel,
      });
    }

    return NextResponse.json({
      success: false,
      message: "خطا در برقراری ارتباط با گوگل. لطفاً اتصال اینترنت سرور یا سهمیه پروژه را بررسی فرمایید."
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `خطا: ${err.message}` }, { status: 400 });
  }
}
