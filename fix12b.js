#!/usr/bin/env node
// fix12b.js — فقط interface را اصلاح می‌کند
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(s) {
  let d = s;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "app"))) return d;
    d = path.dirname(d);
  }
  throw new Error("ریشه پیدا نشد");
}
const root = findRoot(__dirname);
const filePath = path.join(root, "components/AdminProducts.tsx");
let src = fs.readFileSync(filePath, "utf8");

// پیدا کردن و اضافه کردن color_options به interface
// روش: بعد از خط shipping_type در interface (نزدیک خطوط اول فایل)
if (src.includes('color_options?: { name: string; hex: string }[]')) {
  console.log("✅ color_options قبلاً در interface هست");
} else {
  // پیدا کردن shipping_type در ۲۰ خط اول
  const lines = src.split("\n");
  let inserted = false;
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    if (lines[i].includes('shipping_type?:') && lines[i].includes('"post"')) {
      lines.splice(i + 1, 0, '  color_options?: { name: string; hex: string }[];');
      src = lines.join("\n");
      console.log(`✅ color_options بعد از line ${i+1} اضافه شد`);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    console.error("❌ shipping_type در interface پیدا نشد!");
    process.exit(1);
  }
}

fs.writeFileSync(filePath, src, "utf8");
console.log("💾 ذخیره شد");

console.log("\n🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) {
  console.error("❌ Build ناموفق!");
  process.exit(1);
}

execSync("git add -A", { cwd: root, stdio: "inherit" });
execSync(`git commit -m "fix(AdminProducts): add color_options to FullCatalogProduct interface

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: root, stdio: "inherit" });
execSync("git push origin main", { cwd: root, stdio: "inherit" });
console.log("🚀 Push موفق! رنگ محصول الان باید ذخیره بشه.");