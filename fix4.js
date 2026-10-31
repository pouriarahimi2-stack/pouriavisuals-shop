#!/usr/bin/env node
/**
 * fix4.js — آکسون کور
 * اصلاح ۵ مشکل:
 * ۱. پنهان کردن اسلایدر اول در دسکتاپ (فقط یک اسلایدر در دسکتاپ)
 * ۲. بازطراحی اسلایدر موبایل
 * ۳. رفع مشکل اسکرول در موبایل (pb کافی)
 * ۴. رفع چسبیدن دکمه خرید به منوی پایین در محصول
 * ۵. رفع مشکل دکمه افزودن به سبد در کارت‌ها
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

function patch(filePath, label, fn) {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ فایل یافت نشد: ${filePath}`);
    process.exit(1);
  }
  const original = fs.readFileSync(abs, "utf8");
  const updated  = fn(original);
  if (updated === original) {
    console.log(`⚠️  ${label} — تغییری نبود (شاید قبلاً اصلاح شده)`);
  } else {
    fs.writeFileSync(abs, updated, "utf8");
    console.log(`✅ ${label}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// ۱ + ۲ + ۳ — DynamicHomeSections.tsx
// ─────────────────────────────────────────────────────────────────
patch("components/DynamicHomeSections.tsx", "DynamicHomeSections — اسلایدر + اسکرول", (src) => {

  // ۱. مخفی کردن banners_slider در دسکتاپ
  // در DEFAULT_SECTIONS_ORDER: id: "sec_banners" باید showOnDesktop: false بشه
  src = src.replace(
    /(id:\s*"sec_banners"[\s\S]*?showOnDesktop:\s*)true/,
    "$1false"
  );

  // ۲. ارتفاع بیشتر اسلایدر موبایل
  src = src.replace(
    /mobileHeight:\s*160/g,
    "mobileHeight: 220"
  );
  src = src.replace(
    /mobileImageSize:\s*90/g,
    "mobileImageSize: 120"
  );

  // بازطراحی اسلایدر موبایل: layout بهتر با تصویر بزرگتر
  // تغییر horizontal به vertical در موبایل برای نمایش بهتر
  src = src.replace(
    /mobileLayout:\s*"horizontal"/,
    'mobileLayout: "vertical"'
  );

  // ۳. رفع مشکل اسکرول — padding-bottom کافی برای MobileBottomNav
  src = src.replace(
    /pb-24\s+font-sans/,
    "pb-40 sm:pb-24 font-sans"
  );

  return src;
});

// ─────────────────────────────────────────────────────────────────
// ۴ — ProductDetailClient.tsx — دکمه چسبیده به منو
// ─────────────────────────────────────────────────────────────────
patch("components/ProductDetailClient.tsx", "ProductDetailClient — رفع چسبیدن به منو", (src) => {

  // اضافه کردن padding-bottom به کانتینر اصلی تا sticky bar محتوا رو نپوشونه
  // کانتینر اصلی: min-h-screen bg-[var(--bg-primary)]
  src = src.replace(
    /className="min-h-screen bg-\[var\(--bg-primary\)\] text-\[var\(--text-primary\)\] p-4 sm:p-6 lg:p-12 dir-rtl font-sans select-text"/,
    'className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-12 pb-28 sm:pb-6 lg:pb-12 dir-rtl font-sans select-text"'
  );

  // اگر sticky bottom bar با bottom-0 وجود داره → تغییر به bottom-16 md:bottom-0
  // تا بالای MobileBottomNav (h-14 = 56px) قرار بگیره
  src = src.replace(
    /fixed bottom-0 inset-x-0 z-40(.*?)md:hidden/gs,
    (match) => match.replace("fixed bottom-0 inset-x-0 z-40", "fixed bottom-16 md:bottom-0 inset-x-0 z-40")
  );

  // روش جایگزین: اگر sticky bar با bottom-0 left-0 right-0 هست
  src = src.replace(
    /fixed bottom-0 left-0 right-0 z-40/g,
    "fixed bottom-16 md:bottom-0 left-0 right-0 z-40"
  );

  // روش ۳: هر fixed bottom-0 که z-40 یا z-50 داره
  src = src.replace(
    /(fixed\s+)(bottom-0)(\s+(?:inset-x-0|left-0|right-0)[^"]*?z-(?:40|50))/g,
    (m, a, b, c) => a + "bottom-16 md:bottom-0" + c
  );

  return src;
});

// ─────────────────────────────────────────────────────────────────
// ۵ — ProductCard.tsx — رفع مشکل دکمه افزودن به سبد
// ─────────────────────────────────────────────────────────────────
patch("components/ProductCard.tsx", "ProductCard — دکمه افزودن به سبد", (src) => {

  // مطمئن می‌شیم که AddToCartButton با showCounter={false} درست صدا زده می‌شه
  // اگر مستقیم با className سیاه تعریف شده باشه
  src = src.replace(
    /className="[^"]*bg-\[#000000\][^"]*"/g,
    'style={{background:"linear-gradient(135deg,var(--accent-blue) 0%,var(--accent-violet) 100%)"}}'
  );

  // رفع هر دکمه inline با پس‌زمینه مشکی
  src = src.replace(
    /bg-black(?!\s*\/)/g,
    "bg-[var(--accent-blue)]"
  );

  return src;
});

// ─────────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────────
console.log("\n🔨 در حال build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("\n❌ بیلد شکست — commit نمی‌شه.\n");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// Git
// ─────────────────────────────────────────────────────────────────
const msgFile = path.join(ROOT, ".git", "FIX4.txt");
fs.writeFileSync(msgFile, [
  "fix(ui): resolve mobile slider, scroll, sticky-bar & desktop dual-slider",
  "",
  "- banners_slider hidden on desktop (lg:hidden) — only NativePerspectiveSlider shows",
  "- mobile slider: vertical layout, height 220px, image 120px for better UX",
  "- DynamicHomeSections: pb-40 on mobile so content clears MobileBottomNav",
  "- ProductDetailClient: sticky bottom-bar raised to bottom-16 md:bottom-0",
  "- ProductCard: ensured no black bg on AddToCart button",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
].join("\n"), "utf8");

try {
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/FIX4.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ push شد — Vercel شروع به deploy می‌کنه!\n");
} catch (e) {
  console.warn("⚠️  git:", e && e.message ? e.message : String(e));
}