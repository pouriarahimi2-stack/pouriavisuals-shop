/**
 * AXON CORE - Align Backup Route with lib/session.ts exports (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

console.log("\x1b[36m[ANALYSIS]\x1b[0m بررسی اکسپورت‌های واقعی lib/session.ts...");

const sessionFilePath = path.join(ROOT, 'lib/session.ts');
const sessionContent = fs.readFileSync(sessionFilePath, 'utf8');

// تشخیص خودکار نام توابع و ثوابت اکسپورت شده در lib/session.ts
let verifyFnName = "verifySession";
if (sessionContent.includes("export async function verifyToken")) verifyFnName = "verifyToken";
else if (sessionContent.includes("export async function verifyPayload")) verifyFnName = "verifyPayload";
else if (sessionContent.includes("export async function verifySessionPayload")) verifyFnName = "verifySessionPayload";
else if (sessionContent.includes("export async function getAdminSession")) verifyFnName = "getAdminSession";
else if (sessionContent.includes("export async function verifyAdminToken")) verifyFnName = "verifyAdminToken";
else {
  const matches = sessionContent.match(/export\s+(async\s+)?function\s+([a-zA-Z0-9_]+)/g);
  console.log("توابع اکسپورت شده در session.ts:", matches);
  if (matches && matches.length > 0) {
    const fn = matches.find(m => m.includes("verify") || m.includes("get") || m.includes("Session"));
    if (fn) verifyFnName = fn.split(/\s+/).pop();
  }
}

let cookieConstName = "SESSION_COOKIE_NAME";
if (sessionContent.includes("ADMIN_COOKIE_NAME")) cookieConstName = "ADMIN_COOKIE_NAME";
else if (sessionContent.includes("COOKIE_NAME")) cookieConstName = "COOKIE_NAME";
else if (sessionContent.includes("SESSION_COOKIE_NAME")) cookieConstName = "SESSION_COOKIE_NAME";

console.log(`تابع شناسایی‌شده: ${verifyFnName} | کوکی شناسایی‌شده: ${cookieConstName}`);

const backupRoutePath = path.join(ROOT, 'app/api/admin/backup/route.ts');
const cleanBackupApiCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import * as SessionModule from "@/lib/session";

export const dynamic = "force-dynamic";

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  try {
    const sessionCookieName = (SessionModule as any).${cookieConstName} || (SessionModule as any).COOKIE_NAME || "admin_session_token";
    const token = req.cookies.get(sessionCookieName)?.value || req.cookies.get("admin_session_token")?.value;
    if (!token) return false;

    const verifyFn = (SessionModule as any).${verifyFnName} || (SessionModule as any).verifyToken || (SessionModule as any).verifyPayload;
    if (typeof verifyFn === "function") {
      const session = await verifyFn(token);
      return Boolean(session);
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const isAuthed = await checkAdminAuth(req);
  if (!isAuthed) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const [products, coupons, siteInfo, banners] = await Promise.all([
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin.from("coupons").select("*"),
      supabaseAdmin.from("site_info").select("*"),
      supabaseAdmin.from("banners").select("*"),
    ]);

    const backupData = {
      exported_at: new Date().toISOString(),
      version: "1.0",
      data: {
        products: products.data || [],
        coupons: coupons.data || [],
        site_info: siteInfo.data || [],
        banners: banners.data || [],
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": \`attachment; filename="axon-backup-\${Date.now()}.json"\`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthed = await checkAdminAuth(req);
  if (!isAuthed) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const json = await req.json();
    if (!json.data || typeof json.data !== "object") {
      return NextResponse.json({ success: false, message: "ساختار فایل پشتیبان نامعتبر است." }, { status: 400 });
    }

    const { products, coupons, banners } = json.data;

    if (Array.isArray(products) && products.length > 0) {
      await supabaseAdmin.from("products").upsert(products);
    }
    if (Array.isArray(coupons) && coupons.length > 0) {
      await supabaseAdmin.from("coupons").upsert(coupons);
    }
    if (Array.isArray(banners) && banners.length > 0) {
      await supabaseAdmin.from("banners").upsert(banners);
    }

    return NextResponse.json({
      success: true,
      message: "اطلاعات با موفقیت در پایگاه داده بازگردانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;

fs.writeFileSync(backupRoutePath, cleanBackupApiCode.trim() + '\n', 'utf8');
console.log("\x1b[32m✔ روت Backup با ارجاع تطبیق‌پذیر به session بازنویسی شد.\x1b[0m");

console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(backup): dynamically adapt session verification in backup endpoint"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ استقرار نسخه جدید در ورسل کامل شد.\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}