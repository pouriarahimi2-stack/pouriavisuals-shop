/**
 * AXON CORE - Fix OTP_HMAC_SECRET export & Tech News Sync Route (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ اصلاح شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[HOTFIX]\x1b[0m افزودن OTP_HMAC_SECRET و پاکسازی هشدارهای ایمپورت اخبار...");

// =============================================================================
// ۱. تکمیل lib/authSecurityHelper.ts با OTP_HMAC_SECRET بدون وابستگی به URL کلاینت
// =============================================================================
const authHelperCode = `import { NextRequest } from "next/server";
import { verifyPayload, COOKIE_NAME, AdminSessionPayload } from "@/lib/session";

export const OTP_HMAC_SECRET =
  process.env.OTP_HMAC_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "axon_core_otp_secret_key_minimum_32_bytes";

export async function verifyAdminSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyPayload(token);
  } catch {
    return null;
  }
}
`;
writeFile('lib/authSecurityHelper.ts', authHelperCode);

// =============================================================================
// ۲. اصلاح تمیز app/api/news/sync/route.ts با تابع ensureFreshAutonomousNews
// =============================================================================
const newsSyncCode = `import { NextRequest, NextResponse } from "next/server";
import { ensureFreshAutonomousNews } from "@/lib/techNewsHarvester";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    const cronAuth = req.headers.get("authorization");
    const validCronSecret = process.env.CRON_SECRET;

    const isAuthorized =
      session !== null ||
      (validCronSecret && cronAuth === \`Bearer \${validCronSecret}\`);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز به سرویس همگام‌سازی اخبار." },
        { status: 401 }
      );
    }

    const items = await ensureFreshAutonomousNews();
    const count = Array.isArray(items) ? items.length : 0;

    return NextResponse.json({
      success: true,
      message: \`رادار اخبار با موفقیت پایش و بروزرسانی شد (\${count} خبر).\`,
      count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/news/sync/route.ts', newsSyncCode);

// =============================================================================
// ۳. تست بیلد لوکال و ارسال قطعی به گیت‌هاب
// =============================================================================
console.log("تست بیلد لوکال (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد لوکال ۱۰۰٪ بدون هیچ خطایی با موفقیت پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("پوش کامیت به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(build): restore OTP_HMAC_SECRET export and clean news sync import"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تغییرات امنیتی و بیلد نهایی با موفقیت در گیت‌هاب ثبت و مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}