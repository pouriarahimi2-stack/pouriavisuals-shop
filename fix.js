// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON ARCHITECT] در حال هوشمندسازی اعتبارسنجی فرمت کلید Gemini API...');

const files = {
  // ۱. ارتقای وب‌سرویس تست با راهنمای شفاف فارسی برای فرمت کلید
  'app/api/test-ai/route.ts': `// File Path: app/api/test-ai/route.ts
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
        console.warn(\`Model \${mName} error:\`, err?.message);
      }
    }

    if (reply) {
      return NextResponse.json({
        success: true,
        message: \`✓ اتصال با موفقیت برقرار شد! پاسخ هوش مصنوعی: "\${reply.trim()}" (مدل فعال: \${activeModel})\`,
        activeModel,
      });
    }

    return NextResponse.json({
      success: false,
      message: "خطا در برقراری ارتباط با گوگل. لطفاً اتصال اینترنت سرور یا سهمیه پروژه را بررسی فرمایید."
    }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: \`خطا: \${err.message}\` }, { status: 400 });
  }
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ [UPDATED] فایل اصلاح شد: ${filePath}`);
}

console.log('📦 در حال Push به گیت‌هاب...');
try {
  execSync('git add . && git commit -m "fix: smart validation guide for AIzaSy Gemini API key format" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 [DEPLOYED] پچ نهایی دیپلوی شد!');
} catch (e) {
  console.log('⚠️ دستور دستی: git push origin main');
}