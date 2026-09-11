/**
 * AXON CORE - Phase 13: Clean up redundant local backups and optimize repository structure (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
    console.log(`\x1b[31m✖ حذف شد (پوشه زائد): ${dirPath}\x1b[0m`);
  }
}

console.log("\x1b[36m[AXON-PHASE13]\x1b[0m پاکسازی فایل‌ها و پوشه‌های پشتیبان محلی زائد...");

// ۱. حذف پوشه ضمیمه بکاپ‌های قدیمی .axon-fix-backups
const backupsDir = path.join(process.cwd(), '.axon-fix-backups');
deleteFolderRecursive(backupsDir);

// ۲. به‌روزرسانی .gitignore برای اطمینان از عدم بازگشت فایل‌های موقت
const gitignorePath = path.join(process.cwd(), '.gitignore');
let gitignoreContent = "";
if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const additions = [".axon-fix-backups", "fix.js", "repomix-output.xml", ".DS_Store"];
let updated = false;

additions.forEach((item) => {
  if (!gitignoreContent.includes(item)) {
    gitignoreContent += `\n${item}`;
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync(gitignorePath, gitignoreContent.trim() + '\n', 'utf8');
  console.log("\x1b[32m✔ فایل .gitignore به‌روزرسانی شد.\x1b[0m");
}

// =============================================================================
// تست بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "refactor(cleanup): remove redundant local backup trees and harden gitignore rules"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ پاکسازی ساختار مخزن با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}