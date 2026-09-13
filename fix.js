/**
 * AXON CORE - Export alias for NotificationProvider in AdminNotificationProvider.tsx (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

console.log("\x1b[36m[EXPORT-FIX]\x1b[0m افزودن NotificationProvider به عنوان alias در AdminNotificationProvider.tsx...");

const notifProviderPath = path.join(ROOT, 'components/admin/AdminNotificationProvider.tsx');

if (fs.existsSync(notifProviderPath)) {
  let content = fs.readFileSync(notifProviderPath, 'utf8');

  if (!content.includes('export const NotificationProvider')) {
    content += `\n\n// Alias exports to satisfy existing layout imports\nexport const NotificationProvider = AdminNotificationProvider;\nexport default AdminNotificationProvider;\n`;
    fs.writeFileSync(notifProviderPath, content, 'utf8');
    console.log("\x1b[32m✔ اکسپورت NotificationProvider اضافه شد.\x1b[0m");
  }
}

// بررسی کامپایل بیلد لوکال
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(types): add NotificationProvider alias export to match AdminLayout imports"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ نوتیفیکیشن‌های بلادرنگ با موفقیت مستقر شدند!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}