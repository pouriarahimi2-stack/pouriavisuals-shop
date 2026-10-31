#!/usr/bin/env node
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

// ── ProductDetailClient — sticky bar above MobileBottomNav ─────
const detailPath = path.join(ROOT, "components/ProductDetailClient.tsx");
let detail = fs.readFileSync(detailPath, "utf8");

const OLD = '"lg:hidden fixed bottom-0 inset-x-0 z-[110] px-3 py-2.5"';
const NEW = '"lg:hidden fixed bottom-14 inset-x-0 z-[110] px-3 py-2.5"';

if (detail.includes(OLD)) {
  detail = detail.replace(OLD, NEW);
  fs.writeFileSync(detailPath, detail, "utf8");
  console.log("✅ ProductDetailClient.tsx — bottom-0 → bottom-14");
} else {
  console.log("⚠️  الگو پیدا نشد — خط ۲۱۲ رو چک کن");
  // نشون دادن ۵ خط اطراف برای debug
  const lines = detail.split("\n");
  lines.slice(208, 217).forEach((l, i) => console.log(`  ${209+i}: ${l}`));
}

// ── Build ──────────────────────────────────────────────────────
console.log("\n🔨 build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("❌ بیلد شکست.");
  process.exit(1);
}

// ── Git push ───────────────────────────────────────────────────
const msg = path.join(ROOT, ".git", "FIX6.txt");
fs.writeFileSync(msg,
  "fix(ProductDetailClient): sticky bar bottom-0 -> bottom-14 above MobileBottomNav\n\n" +
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\n" +
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV\n",
  "utf8"
);
execSync("git add -A",               { stdio: "inherit", cwd: ROOT });
execSync('git commit -F ".git/FIX6.txt"', { stdio: "inherit", cwd: ROOT });
execSync("git push origin main",     { stdio: "inherit", cwd: ROOT });
console.log("✅ push شد!");