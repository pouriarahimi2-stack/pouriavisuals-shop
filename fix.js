/**
 * AXON CORE - Phase 20: Event-Driven Analytics & Conversion Funnel (fix.js)
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

console.log("\x1b[36m[AXON-PHASE20]\x1b[0m پیاده‌سازی سامانه ردیابی قیف تبدیل و تحلیل رویدادها...");

// =============================================================================
// ۱. ساخت ابزار ردیابی رویدادها lib/analytics.ts
// =============================================================================
const analyticsEngineCode = `/**
 * AXON CORE - Event-Driven Analytics & Funnel Tracking
 */

type EcommerceEvent = 
  | "view_product" 
  | "add_to_cart" 
  | "begin_checkout" 
  | "coupon_applied" 
  | "payment_started" 
  | "purchase";

export const analytics = {
  track(event: EcommerceEvent, payload?: Record<string, any>) {
    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      ...(payload ? { payload } : {}),
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("axon_analytics_funnel_log") || "[]");
        existing.push(eventData);
        // نگهداری ۱۰۰ رویداد آخر در لوکال استوریج
        if (existing.length > 100) existing.shift();
        localStorage.setItem("axon_analytics_funnel_log", JSON.stringify(existing));
      } catch {}
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(\`📊 [ANALYTICS_EVENT]: \${event}\`, payload || "");
    }
  },
};
`;
writeFile('lib/analytics.ts', analyticsEngineCode);

// =============================================================================
// ۲. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git diff --cached --quiet || git commit -m "feat(analytics): implement event-driven analytics and conversion funnel tracking utility"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سامانه تحلیل رفتار با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}