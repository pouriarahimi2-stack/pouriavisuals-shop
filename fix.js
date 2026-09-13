/**
 * AXON CORE - Fix CustomerSessionPayload interface definition (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("\x1b[36m[TYPE-FIX]\x1b[0m افزودن قطعی name به اینترفیس CustomerSessionPayload...");

const customerSessionPath = path.join(process.cwd(), 'lib/customerSession.ts');

if (fs.existsSync(customerSessionPath)) {
  let content = fs.readFileSync(customerSessionPath, 'utf8');

  // بازنویسی دقیق اینترفیس با در نظر گرفتن تمام فیلدهای مورد استفاده در روت سشن
  content = content.replace(
    /export interface CustomerSessionPayload\s*\{[\s\S]*?\}/,
    `export interface CustomerSessionPayload {
  id: string;
  phone: string;
  username?: string;
  name?: string;
  email?: string;
  sid: string;
  iat: number;
  exp: number;
}`
  );

  fs.writeFileSync(customerSessionPath, content, 'utf8');
  console.log("\x1b[32m✔ فایل lib/customerSession.ts با فیلدهای کامل بازنویسی شد.\x1b[0m");
}

// بررسی کامپایل بیلد لوکال
console.log("بررسی کامپایل بیلد (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمام خطاهای تایپ برطرف شد و بیلد ۱۰۰٪ موفق شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(types): properly add name and email properties to CustomerSessionPayload"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ فاز صفر با موفقیت بسته شد و روی سرور مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}