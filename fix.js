/**
 * AXON CORE - Phase 9: Standardized API Contracts & Request Validation Guard (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-PHASE9]\x1b[0m پیاده‌سازی لایه استاندارد اعتبارسنجی سروری و مدیریت خطا...");

// =============================================================================
// ۱. ایجاد ابزار مرکزی اعتبارسنجی در lib/validationGuard.ts
// =============================================================================
const validationGuardCode = `/**
 * AXON CORE - Central API Validation & Sanitization Guard
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export function validatePhoneNumber(phone: string): boolean {
  const clean = String(phone || "").trim().replace(/\\D/g, "");
  return /^09\\d{9}$/.test(clean);
}

export function validatePostalCode(postal: string): boolean {
  if (!postal) return true; // اختیاری
  const clean = String(postal).trim().replace(/\\D/g, "");
  return clean.length === 10;
}

export function sanitizeInput(input: string): string {
  return String(input || "")
    .replace(/<[^>]*>?/gm, "") // حذف تگ‌های HTML جهت جلوگیری از XSS
    .trim();
}

export function createApiError(message: string, status: number = 400, errors?: Record<string, string>) {
  return Response.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}

export function createApiSuccess<T>(data?: T, message: string = "عملیات با موفقیت انجام شد.", status: number = 200) {
  return Response.json(
    {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
    },
    { status }
  );
}
`;
writeFile('lib/validationGuard.ts', validationGuardCode);

// =============================================================================
// ۲. ایمن‌سازی و استانداردسازی روت تماس با ما (/api/contact/route.ts)
// =============================================================================
const contactApiRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validatePhoneNumber, sanitizeInput, createApiError, createApiSuccess } from "@/lib/validationGuard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = sanitizeInput(body?.full_name || body?.fullName);
    const phone = String(body?.phone || "").trim();
    const subject = sanitizeInput(body?.subject || "مشاوره تخصصی");
    const message = sanitizeInput(body?.message);

    if (!fullName || fullName.length < 2) {
      return createApiError("نام و نام خانوادگی نامعتبر است.", 400);
    }

    if (!validatePhoneNumber(phone)) {
      return createApiError("شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود.", 400);
    }

    if (!message || message.length < 5) {
      return createApiError("متن پیام یا شرح نیاز باید حداقل ۵ کاراکتر باشد.", 400);
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert([
      {
        full_name: fullName,
        phone: phone.replace(/\\D/g, ""),
        subject,
        message,
        status: "unread",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      throw error;
    }

    return createApiSuccess(null, "پیام شما با موفقیت ثبت شد و به زودی توسط کارشناسان بررسی خواهد شد.");
  } catch (err: any) {
    console.error("Contact API Error:", err);
    return createApiError("خطای داخلی سرور در ثبت پیام.", 500);
  }
}
`;
writeFile('app/api/contact/route.ts', contactApiRoute);

// =============================================================================
// ۳. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(validation): implement centralized validation guard and standardize API responses"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ لایه اعتبارسنجی و استانداردسازی API با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}