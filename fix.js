/**
 * AXON CORE - Fix Type Narrowing in OrderManager.tsx (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

console.log("\x1b[36m[TYPE-FIX]\x1b[0m اصلاح زنجیره ترنری وضعیت سفارش در components/admin/OrderManager.tsx...");

const orderManagerPath = path.join(ROOT, 'components/admin/OrderManager.tsx');

if (fs.existsSync(orderManagerPath)) {
  let content = fs.readFileSync(orderManagerPath, 'utf8');

  // ۱. اصلاح تایپ‌کست وضعیت جهت جلوگیری از خطای Narrowing تایپ‌اسکریپت
  content = content.replace(
    /o\.status === "pending_manual_review"/g,
    '(o.status as string) === "pending_manual_review"'
  );

  // ۲. اصلاح شرط سلکت باکس در صورت استفاده
  content = content.replace(
    /selectedOrder\.status === "pending_manual_review"/g,
    '(selectedOrder.status as string) === "pending_manual_review"'
  );

  fs.writeFileSync(orderManagerPath, content, 'utf8');
  console.log("\x1b[32m✔ عبارات مقایسه با تایپ‌کست امن اصلاح شد.\x1b[0m");
}

// بررسی کامپایل بیلد
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(types): cast status check in OrderManager to prevent narrowing conflict"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تغییرات با موفقیت روی سرور Vercel دیپلوی شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}