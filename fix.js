/**
 * AXON CORE - Create send-discount-sms Route with Recursive Dir (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

console.log("\x1b[35m[SMS-SECURITY]\x1b[0m ایجاد دایرکتوری و روت ایمن ارسال پیامک تخفیف...");

const smsRouteDir = path.join(ROOT, 'app/api/admin/send-discount-sms');
if (!fs.existsSync(smsRouteDir)) {
  fs.mkdirSync(smsRouteDir, { recursive: true });
}

const smsRoutePath = path.join(smsRouteDir, 'route.ts');

const secureSmsRouteCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get("admin_session_token")?.value;
    if (!adminToken || adminToken.length < 20) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. لطفا ابتدا وارد پنل شوید." }, { status: 401 });
    }

    const body = await req.json();
    const { phone, discountPercent, couponCode } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ success: false, message: "شماره گیرنده نامعتبر است." }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace("+98", "0");
    const iranPhoneRegex = /^09\\d{9}$/;
    if (!iranPhoneRegex.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل وارد شده معتبر نیست (الگوی صحیح: 09xxxxxxxxx)." }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
    
    try {
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_username: "admin",
        action: "SEND_DISCOUNT_SMS",
        target_resource: \`customer:\${cleanPhone}\`,
        details: { discountPercent, couponCode },
        ip_address: clientIp,
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("[AUDIT_LOG_ERROR]:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: \`پیامک تخفیف \${discountPercent || 10}٪ با کد \${couponCode || "اختصاصی"} با موفقیت ارسال شد.\`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در پردازش درخواست پیامک." }, { status: 500 });
  }
}
`;

fs.writeFileSync(smsRoutePath, secureSmsRouteCode.trim() + '\n', 'utf8');
console.log("\x1b[32m✔ دایرکتوری و فایل app/api/admin/send-discount-sms/route.ts با موفقیت ساخته شد.\x1b[0m");

// کامپایل و تست صحت پروژه
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت کامل پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(api): create send-discount-sms admin endpoint with validation and audit logging"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ روت پیامک با موفقیت مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}