/**
 * AXON CORE - Phase 14: Database-Based Rate Limiting & Abuse Protection (fix.js)
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

console.log("\x1b[36m[AXON-PHASE14]\x1b[0m پیاده‌سازی Rate Limiting مبتنی بر پایگاه داده...");

// =============================================================================
// ۱. ساخت ابزار lib/rateLimiter.ts
// =============================================================================
const rateLimiterCode = `/**
 * AXON CORE - Database-Backed Rate Limiting Guard
 */

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMinutes: number = 10): Promise<boolean> {
  try {
    const now = new Date();
    const windowAgo = new Date(now.getTime() - windowMinutes * 60 * 1000).toISOString();

    // بررسی تعداد درخواست‌ها در بازه زمانی مشخص
    const { count, error } = await supabaseAdmin
      .from("contact_messages") // یا جدول لاگ عمومی درخواست‌ها
      .select("*", { count: "exact", head: true })
      .eq("phone", identifier)
      .gte("created_at", windowAgo);

    if (error) {
      return true; // در صورت خطای دیتابیس به صورت پیش‌فرض اجازه دسترسی می‌دهیم تا اختلالی ایجاد نشود
    }

    return (count || 0) < maxAttempts;
  } catch {
    return true;
  }
}
`;
writeFile('lib/rateLimiter.ts', rateLimiterCode);

// =============================================================================
// ۲. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "security(rate-limit): implement database-backed rate limiting guard for serverless resilience"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ لایه Rate Limiting پایگاه‌داده با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}