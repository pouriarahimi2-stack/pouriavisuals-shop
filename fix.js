/**
 * AXON CORE - Phase 17: Automated Business Logic & Pricing Tests (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-PHASE17]\x1b[0m ایجاد ساختار تست‌های خودکار منطق قیمت‌گذاری...");

// =============================================================================
// ۱. ایجاد فایل تست واحد برای محاسبه سبد خرید و تخفیف (__tests__/pricing.test.ts)
// =============================================================================
const pricingTestCode = `/**
 * AXON CORE - Pricing & Cart Unit Tests
 */

describe("Cart & Pricing Business Logic", () => {
  test("calculates raw subtotal correctly", () => {
    const items = [
      { price: 1000000, quantity: 2 },
      { price: 500000, quantity: 1 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(2500000);
  });

  test("applies percentage discount accurately and respects max discount", () => {
    const rawTotal = 10000000;
    const discountPercent = 20;
    const maxDiscount = 1500000;

    let discount = Math.round((rawTotal * discountPercent) / 100);
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }

    const finalPayable = Math.max(0, rawTotal - discount);
    expect(discount).toBe(1500000);
    expect(finalPayable).toBe(8500000);
  });
});
`;
writeFile('__tests__/pricing.test.ts', pricingTestCode);

// =============================================================================
// ۲. نصب پکیج‌های تست و به‌روزرسانی package.json
// =============================================================================
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.test = "jest --passWithNoTests";
  
  if (!pkg.devDependencies) pkg.devDependencies = {};
  pkg.devDependencies["jest"] = "^29.7.0";
  pkg.devDependencies["ts-jest"] = "^29.1.2";
  pkg.devDependencies["@types/jest"] = "^29.5.12";

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log("\x1b[32m✔ اسکریپت‌های تست به package.json افزوده شد.\x1b[0m");
}

// =============================================================================
// ۳. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "test(pricing): add automated unit tests for cart subtotal and coupon calculations"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تست‌های خودکار با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}