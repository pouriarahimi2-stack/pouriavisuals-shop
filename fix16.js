#!/usr/bin/env node
// fix16.js — فقط interface ProductCard (build error از fix15)
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(s) {
  let d = s;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "app"))) return d;
    d = path.dirname(d);
  }
  throw new Error("ریشه پروژه پیدا نشد!");
}
const root = findRoot(__dirname);
const pcPath = path.join(root, "components/ProductCard.tsx");
let src = fs.readFileSync(pcPath, "utf8");

// پیدا کردن interface و اضافه کردن color_options
const OLD = `    warranty?:       string;
  };
}`;
const NEW = `    warranty?:       string;
    color_options?:  { name: string; hex: string }[];
    shipping_type?:  string;
  };
}`;

if (src.includes("color_options") && src.includes("shipping_type")) {
  console.log("✅ قبلاً اضافه شده");
} else if (src.includes(OLD)) {
  src = src.replace(OLD, NEW);
  fs.writeFileSync(pcPath, src, "utf8");
  console.log("✅ interface ProductCard اصلاح شد");
} else {
  // regex fallback
  src = src.replace(/warranty\?:\s+string;\s+\};\s+\}/, `warranty?:       string;\n    color_options?:  { name: string; hex: string }[];\n    shipping_type?:  string;\n  };\n}`);
  fs.writeFileSync(pcPath, src, "utf8");
  console.log("✅ interface اصلاح شد (regex)");
}

console.log("🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) { console.error("❌ Build ناموفق!"); process.exit(1); }

console.log("📤 Git...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  execSync(`git commit -m "fix(ProductCard): add color_options and shipping_type to interface

- Fixes TS build error from fix15
- color_options and shipping_type now typed in ProductCardProps

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch (e) { console.error("Git:", e.message); }

console.log("✅ fix16.js کامل!");