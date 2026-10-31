#!/usr/bin/env node
// check.js — وضعیت فایل‌ها رو نشون می‌ده
const fs   = require("fs");
const path = require("path");
const ROOT = __dirname;

const files = [
  "components/DynamicHomeSections.tsx",
  "components/ProductDetailClient.tsx",
  "components/ProductCard.tsx",
  "components/MobileBottomNav.tsx",
];

for (const f of files) {
  const abs = path.join(ROOT, f);
  if (!fs.existsSync(abs)) { console.log("❌ نیست:", f); continue; }
  const txt = fs.readFileSync(abs, "utf8");
  console.log("\n══════", f, "══════");
  console.log("  حجم:", txt.length, "کاراکتر");
  // نشون دادن خطوط مهم
  const lines = txt.split("\n");
  lines.forEach((l, i) => {
    const t = l.trim();
    if (
      t.includes("showOnDesktop") ||
      t.includes("mobileHeight") ||
      t.includes("pb-24") || t.includes("pb-40") ||
      t.includes("bottom-0") || t.includes("bottom-16") ||
      t.includes("pb-28") ||
      t.includes("bg-[#000000]") || t.includes("bg-black")
    ) {
      console.log(`  خط ${i+1}: ${t}`);
    }
  });
}
console.log("\n✅ بررسی تمام شد");