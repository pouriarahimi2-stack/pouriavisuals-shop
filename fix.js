/**
 * AXON CORE - Switch All Domain Bindings & SEO Exclusively to axoncore.ir (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function replaceInFile(relPath, searchStr, replaceStr) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchStr)) {
    content = content.split(searchStr).join(replaceStr);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`\x1b[32m✔ دامنه در فایل ${relPath} به axoncore.ir اصلاح شد.\x1b[0m`);
  }
}

console.log("\x1b[36m[DOMAIN-SWITCH]\x1b[0m پاکسازی تمام ارجاعات دامنه قدیمی و تثبیت انحصاری axoncore.ir...");

// اصلاح فایل‌های متادیتا و متغیرها
replaceInFile('app/layout.tsx', 'pouriavisuals.ir', 'axoncore.ir');
replaceInFile('app/robots.ts', 'pouriavisuals.ir', 'axoncore.ir');
replaceInFile('app/sitemap.ts', 'pouriavisuals.ir', 'axoncore.ir');
replaceInFile('app/manifest.ts', 'pouriavisuals.ir', 'axoncore.ir');
replaceInFile('.env.local', 'pouriavisuals.ir', 'axoncore.ir');

// کامپایل و انتشار به گیت‌هاب
console.log("تست بیلد با دامنه جدید axoncore.ir...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با دامنه رسمی axoncore.ir تایید شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("پوش نهایی به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "chore(domain): enforce axoncore.ir across all layout, metadata, and auth configurations"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تغییرات به گیت‌هاب و ورسل برای دامنه axoncore.ir ارسال شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}