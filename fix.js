/**
 * AXON CORE - Security Headers & Client IP Hardening (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ اصلاح شد: ${relPath}\x1b[0m`);
}

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

console.log("\x1b[35m[HARDENING]\x1b[0m اصلاح هدرهای امنیتی و اعتبارسنجی IP در احراز هویت ادمین...");

// =============================================================================
// ۱. پالایش آدرس IP در app/api/admin/login/route.ts
// =============================================================================
const loginRoutePath = 'app/api/admin/login/route.ts';
let loginContent = readFile(loginRoutePath);

if (loginContent && loginContent.includes('req.headers.get("x-forwarded-for")')) {
  loginContent = loginContent.replace(
    /const\s+ip\s*=\s*req\.headers\.get\("x-forwarded-for"\)\s*\|\|\s*[^;]+;/g,
    `const rawForwarded = req.headers.get("x-forwarded-for");
    const ip = rawForwarded ? rawForwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "127.0.0.1");`
  );
  writeFile(loginRoutePath, loginContent);
}

// =============================================================================
// ۲. ایمن‌سازی هدرهای امنیتی در next.config.ts
// =============================================================================
const nextConfigPath = 'next.config.ts';
let nextConfigContent = readFile(nextConfigPath);

if (nextConfigContent && !nextConfigContent.includes('X-Content-Type-Options')) {
  const securityHeadersBlock = `
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },`;

  if (nextConfigContent.includes('const nextConfig: NextConfig = {')) {
    nextConfigContent = nextConfigContent.replace(
      'const nextConfig: NextConfig = {',
      'const nextConfig: NextConfig = {' + securityHeadersBlock
    );
    writeFile(nextConfigPath, nextConfigContent);
  }
}

// =============================================================================
// ۳. بیلد و ارسال تغییرات به گیت‌هاب
// =============================================================================
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد ۱۰۰٪ موفقیت‌آمیز بود!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "security: enforce strict security headers and sanitize client IP resolution in admin login"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمام تنظیمات با موفقیت روی سرور Vercel اعمال شدند!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}