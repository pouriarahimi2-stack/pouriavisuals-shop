#!/usr/bin/env node
// diagnose8.js — پیدا کردن فایل‌های مرتبط با اسلایدر بنر و AddToCart
const fs   = require("fs");
const path = require("path");
const ROOT = __dirname;

const componentsDir = path.join(ROOT, "components");
const all = fs.readdirSync(componentsDir);

// فایل‌های مرتبط با slider / banner / cart
const targets = all.filter(f => {
  const n = f.toLowerCase();
  return n.includes("banner") || n.includes("slider") || n.includes("slide") ||
         n.includes("cart") || n.includes("addto") || n.includes("chat") ||
         n.includes("livechat") || n.includes("support") || n.includes("floating");
});

console.log("=== فایل‌های مرتبط ===");
targets.forEach(f => console.log(" ", f));

// بررسی DynamicHomeSections برای مشخص کردن کامپوننت اسلایدر
const dynPath = path.join(ROOT, "components/DynamicHomeSections.tsx");
if (fs.existsSync(dynPath)) {
  const src = fs.readFileSync(dynPath, "utf8");
  console.log("\n=== import های DynamicHomeSections ===");
  src.split("\n").filter(l => l.trim().startsWith("import")).forEach(l => console.log(" ", l));

  console.log("\n=== خطوط مرتبط با banners_slider ===");
  src.split("\n").forEach((l, i) => {
    if (l.includes("banners_slider") || l.includes("BannerSlider") || l.includes("Banner") || l.includes("Slide")) {
      console.log(`  ${i+1}: ${l}`);
    }
  });
}

// بررسی هر فایل banner/slider
for (const f of targets) {
  const abs = path.join(componentsDir, f);
  const src = fs.readFileSync(abs, "utf8");
  const lines = src.split("\n");
  const important = lines.filter(l => {
    const t = l.trim();
    return t.includes("fixed") || t.includes("bottom-") || t.includes("overflow") ||
           t.includes("pb-") || t.includes("mobileHeight") || t.includes("h-[") ||
           t.includes("className=") && (t.includes("relative") || t.includes("absolute"));
  }).slice(0, 20);
  if (important.length > 0) {
    console.log(`\n=== ${f} (${src.length} chars) ===`);
    important.forEach(l => console.log("  ", l.trim()));
  }
}

// بررسی app/layout.tsx یا page.tsx برای overflow
const appPages = ["app/layout.tsx", "app/page.tsx", "app/(main)/page.tsx", "app/(main)/layout.tsx"];
for (const p of appPages) {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) continue;
  const src = fs.readFileSync(abs, "utf8");
  const lines = src.split("\n");
  const important = lines.filter(l => l.includes("overflow") || l.includes("pb-") || l.includes("scroll"));
  if (important.length > 0) {
    console.log(`\n=== ${p} ===`);
    important.forEach(l => console.log("  ", l.trim()));
  }
}

console.log("\n✅ تشخیص تمام شد");