#!/usr/bin/env node
// fix4b.js — اصلاح خرابی interface و rebuild
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

const filePath = path.join(ROOT, "components/DynamicHomeSections.tsx");
let src = fs.readFileSync(filePath, "utf8");

// بازگشت interface به حالت درست: "horizontal" | "vertical"
// regex اشتباه قبلی، "horizontal" رو از union type حذف کرده بود
src = src.replace(
  /mobileLayout:\s*"vertical"\s*\|\s*"vertical"/g,
  'mobileLayout: "horizontal" | "vertical"'
);
// اگر فقط "vertical" موند (union کاملاً خراب شد)
src = src.replace(
  /mobileLayout:\s*"vertical";(\s*\}[\s\S]*?DEFAULT_BANNER_SIZING)/,
  'mobileLayout: "horizontal" | "vertical";$1'
);

// DEFAULT_BANNER_SIZING: mobileLayout باید "horizontal" بمونه (چون interface هردو رو قبول داره)
// فقط اطمینان می‌دیم که DEFAULT_BANNER_SIZING.mobileLayout درست باشه
// پیدا کردن بلوک DEFAULT_BANNER_SIZING و تنظیم صحیح
src = src.replace(
  /(export const DEFAULT_BANNER_SIZING[\s\S]*?mobileLayout:\s*)"vertical"/,
  '$1"horizontal"'
);

fs.writeFileSync(filePath, src, "utf8");
console.log("✅ DynamicHomeSections.tsx — interface مجدداً درست شد");

// Build
console.log("\n🔨 build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("\n❌ بیلد شکست.\n");
  process.exit(1);
}

// Git
const msgFile = path.join(ROOT, ".git", "FIX4B.txt");
fs.writeFileSync(msgFile, [
  "fix(DynamicHomeSections): restore mobileLayout interface type",
  "",
  "Regex in fix4.js accidentally mutated the TypeScript interface union type.",
  "Restored: mobileLayout: 'horizontal' | 'vertical'",
  "banners_slider still hidden on desktop (showOnDesktop: false)",
  "mobileHeight: 220, mobileImageSize: 120, pb-40 on mobile all intact.",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
].join("\n"), "utf8");

try {
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/FIX4B.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("✅ push شد!\n");
} catch (e) {
  console.warn("⚠️ git:", e && e.message ? e.message : String(e));
}