#!/usr/bin/env node
// fix14.js — رفع اصلی مشکل تیپاکس: shipping_type در addToCart CartContext
// یک خط اضافه بعد از selectedColor در new item object

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(s) {
  let d = s;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "app"))) return d;
    d = path.dirname(d);
  }
  throw new Error("❌ ریشه پروژه پیدا نشد!");
}
const root = findRoot(__dirname);
console.log("📁 root:", root);

const filePath = path.join(root, "context/CartContext.tsx");
let src = fs.readFileSync(filePath, "utf8");

console.log("\n🔍 وضعیت فعلی:");
console.log("  shipping_type در new item:", src.includes("shipping_type: item.shipping_type") ? "✅" : "❌");

if (src.includes("shipping_type: item.shipping_type")) {
  console.log("\n✅ قبلاً fix شده — نیازی به تغییر نیست.");
} else {
  // پیدا کردن دقیق:  selectedColor: item.selectedColor || undefined,
  const OLD = `            selectedColor: item.selectedColor || undefined,
          },`;
  const NEW = `            selectedColor: item.selectedColor || undefined,
            shipping_type: item.shipping_type || undefined,
          },`;

  if (src.includes(OLD)) {
    src = src.replace(OLD, NEW);
    console.log("  ✅ shipping_type: item.shipping_type اضافه شد");
  } else {
    // روش جایگزین — پیدا کردن selectedColor در addToCart
    const addIdx = src.indexOf("const addToCart = useCallback");
    if (addIdx === -1) { console.error("❌ addToCart پیدا نشد!"); process.exit(1); }

    const selColorIdx = src.indexOf("selectedColor: item.selectedColor", addIdx);
    if (selColorIdx === -1) { console.error("❌ selectedColor در addToCart پیدا نشد!"); process.exit(1); }

    const lineEnd = src.indexOf("\n", selColorIdx);
    src = src.slice(0, lineEnd) + "\n            shipping_type: item.shipping_type || undefined," + src.slice(lineEnd);
    console.log("  ✅ shipping_type اضافه شد (روش جایگزین)");
  }

  fs.writeFileSync(filePath, src, "utf8");
  console.log("  💾 context/CartContext.tsx ذخیره شد");
}

// تایید
console.log("\n📋 تایید:");
const addIdx = src.indexOf("const addToCart = useCallback");
const block = src.slice(addIdx, addIdx + 800);
console.log("  shipping_type در new item:", block.includes("shipping_type: item.shipping_type") ? "✅" : "❌");
console.log("  selectedColor در new item:", block.includes("selectedColor: item.selectedColor") ? "✅" : "❌");

// نمایش بخش new item
const niStart = block.indexOf("updated = [");
if (niStart !== -1) {
  console.log("\n  new item object:");
  block.slice(niStart, niStart + 400).split("\n").forEach(l => console.log("    " + l));
}

// Build
console.log("\n🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) {
  console.error("❌ Build ناموفق!");
  process.exit(1);
}

// Git
console.log("\n📤 Git...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  const msg = `fix(CartContext): preserve shipping_type in addToCart new item

- selectedColor was saved but shipping_type was missing from new item object
- Now shipping_type: item.shipping_type is included when adding to cart
- This fixes the tipax/post filter in checkout (allowedShipping useMemo)
- Products marked as tipax-only will now correctly hide پست پیشتاز option

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe`;
  execSync(`git commit -m "${msg}"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch (e) {
  console.error("Git:", e.message);
}

console.log("\n✅ fix14.js کامل!");
console.log("🚚 الان:");
console.log("  محصول tipax → فقط تیپاکس نشون داده می‌شه");
console.log("  محصول post  → فقط پست پیشتاز نشون داده می‌شه");
console.log("  محصول both  → هر دو نشون داده می‌شن");