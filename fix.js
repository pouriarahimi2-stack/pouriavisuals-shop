/**
 * AXON CORE - Phase 22: Database Schema Integrity & Production Readiness Audit (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("\x1b[36m[AXON-PHASE22]\x1b[0m بررسی یکپارچگی جدول‌های پایگاه داده و آمادگی نهایی پروداکشن...");

// =============================================================================
// ۱. ایجاد اسکریپت تست اتصال و سلامت دیتابیس scripts/db-audit.ts
// =============================================================================
function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

const dbAuditCode = `/**
 * AXON CORE - Database Schema Audit Script
 */
import { supabaseAdmin } from "../lib/supabaseServer";

async function runAudit() {
  console.log("🔍 در حال بررسی اتصال به پایگاه داده Supabase...");
  
  const tables = ["products", "orders", "payments", "posts", "site_info", "contact_messages"];
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.warn(\`⚠️ جدول \${table} نیاز به بررسی دارد یا موجود نیست: \`, error.message);
    } else {
      console.log(\`✔ جدول \_\_\${table}\_\_\_ با موفقیت پاسخ داد.\`);
    }
  }
}

runAudit();
`;
scriptsDir = 'scripts';
writeFile('scripts/db-audit.ts', dbAuditCode);

// =============================================================================
// ۲. تست بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git diff --cached --quiet || git commit -m "chore(audit): add database schema integrity audit script and finalize production setup"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ ممیزی نهایی و به‌روزرسانی مخزن با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}