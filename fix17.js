#!/usr/bin/env node
// fix17.js — مستقیم interface ProductCard رو بازنویسی می‌کنه
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(s) {
  let d = s;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "app"))) return d;
    d = path.dirname(d);
  }
  throw new Error("ریشه پیدا نشد!");
}
const root = findRoot(__dirname);
const pcPath = path.join(root, "components/ProductCard.tsx");
let src = fs.readFileSync(pcPath, "utf8");

// پیدا کردن interface ProductCardProps و کامل جایگزین کردنش
const interfaceRegex = /interface ProductCardProps \{[\s\S]*?\}\s*\}/;
const match = src.match(interfaceRegex);
if (match) {
  console.log("🔍 interface فعلی:");
  console.log(match[0]);
}

const NEW_INTERFACE = `interface ProductCardProps {
  product: {
    id:              string | number;
    title?:          string;
    name?:           string;
    price:           number;
    discount_price?: number | null;
    discountPrice?:  number | null;
    image?:          string | null;
    image_url?:      string | null;
    images?:         string[];
    category?:       string;
    stock?:          number;
    warranty?:       string;
    color_options?:  { name: string; hex: string }[];
    shipping_type?:  string;
  };
}`;

if (interfaceRegex.test(src)) {
  src = src.replace(interfaceRegex, NEW_INTERFACE);
  console.log("✅ interface ProductCardProps جایگزین شد");
  fs.writeFileSync(pcPath, src, "utf8");
  console.log("💾 ذخیره شد");
} else {
  console.error("❌ interface پیدا نشد!");
  process.exit(1);
}

console.log("🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) { console.error("❌ Build ناموفق!"); process.exit(1); }

console.log("📤 Git...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  execSync(`git commit -m "fix(ProductCard): extend interface with color_options and shipping_type

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch (e) { console.error("Git:", e.message); }

console.log("\n✅ fix17 کامل!");