#!/usr/bin/env node
// fix12.js — رفع مشکل color_options در AdminProducts.tsx
// سه تغییر جراحی:
// ۱. interface: اضافه کردن color_options
// ۲. openEdit: لود کردن localColors از محصول موجود
// ۳. saveProduct: اضافه کردن color_options: localColors به payload

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

const filePath = path.join(root, "components/AdminProducts.tsx");
let src = fs.readFileSync(filePath, "utf8");

// ══════════════════════════════════════════════════════════
// ۱. اضافه کردن color_options به interface
// ══════════════════════════════════════════════════════════
console.log("\n[۱] interface FullCatalogProduct...");
const OLD_INTERFACE_END = `  shipping_type?: "post" | "tipax" | "both";
}`;
const NEW_INTERFACE_END = `  shipping_type?: "post" | "tipax" | "both";
  color_options?: { name: string; hex: string }[];
}`;

if (src.includes('color_options?: { name: string; hex: string }[]')) {
  console.log("  ✅ قبلاً اضافه شده");
} else if (src.includes(OLD_INTERFACE_END)) {
  src = src.replace(OLD_INTERFACE_END, NEW_INTERFACE_END);
  console.log("  ✅ color_options به interface اضافه شد");
} else {
  console.log("  ⚠️ الگو پیدا نشد — بررسی دستی:");
  src.split("\n").forEach((l, i) => { if (l.includes("shipping_type") && l.includes("post")) console.log(`  line ${i+1}: ${l}`); });
}

// ══════════════════════════════════════════════════════════
// ۲. openEdit — لود کردن localColors از محصول
// ══════════════════════════════════════════════════════════
console.log("\n[۲] openEdit — لود localColors...");
const OLD_OPEN_EDIT = `  const openEdit = (p: FullCatalogProduct) => {
    setEditingProd(p);
    setEditForm({...p, images:[...(p.images||[])]});
    setActiveTab("basic");`;
const NEW_OPEN_EDIT = `  const openEdit = (p: FullCatalogProduct) => {
    setEditingProd(p);
    setEditForm({...p, images:[...(p.images||[])]});
    setActiveTab("basic");
    setLocalColors(Array.isArray(p.color_options) ? p.color_options : []);`;

if (src.includes("setLocalColors(Array.isArray(p.color_options)")) {
  console.log("  ✅ قبلاً اضافه شده");
} else if (src.includes(OLD_OPEN_EDIT)) {
  src = src.replace(OLD_OPEN_EDIT, NEW_OPEN_EDIT);
  console.log("  ✅ setLocalColors در openEdit اضافه شد");
} else {
  console.log("  ⚠️ الگوی openEdit پیدا نشد — جستجوی گسترده‌تر...");
  const idx = src.indexOf("const openEdit = (p: FullCatalogProduct)");
  if (idx !== -1) {
    // پیدا کردن setActiveTab("basic") بعدی
    const afterIdx = src.indexOf('setActiveTab("basic");', idx);
    if (afterIdx !== -1) {
      const insertAfter = afterIdx + 'setActiveTab("basic");'.length;
      src = src.slice(0, insertAfter) + "\n    setLocalColors(Array.isArray(p.color_options) ? p.color_options : []);" + src.slice(insertAfter);
      console.log("  ✅ setLocalColors اضافه شد (روش جایگزین)");
    }
  }
}

// ══════════════════════════════════════════════════════════
// ۳. openAdd — ریست کردن localColors
// ══════════════════════════════════════════════════════════
console.log("\n[۳] openAdd — reset localColors...");
const OLD_OPEN_ADD = `  const openAdd  = () => { setEditingProd(null); setEditForm(EMPTY_FORM()); setActiveTab("basic"); setProfitPctLocal(25); setIsModalOpen(true); };`;
const NEW_OPEN_ADD = `  const openAdd  = () => { setEditingProd(null); setEditForm(EMPTY_FORM()); setActiveTab("basic"); setProfitPctLocal(25); setLocalColors([]); setIsModalOpen(true); };`;

if (src.includes("setLocalColors([]);") && src.includes("openAdd")) {
  console.log("  ✅ قبلاً اضافه شده");
} else if (src.includes(OLD_OPEN_ADD)) {
  src = src.replace(OLD_OPEN_ADD, NEW_OPEN_ADD);
  console.log("  ✅ setLocalColors([]) در openAdd اضافه شد");
} else {
  console.log("  ⚠️ الگوی openAdd پیدا نشد — جستجو...");
  // تلاش انعطاف‌پذیر
  const m = src.match(/const openAdd\s*=\s*\(\)\s*=>\s*\{[^}]+\}/);
  if (m) {
    const newFn = m[0].replace("setIsModalOpen(true);", "setLocalColors([]); setIsModalOpen(true);");
    src = src.replace(m[0], newFn);
    console.log("  ✅ setLocalColors([]) اضافه شد (روش جایگزین)");
  }
}

// ══════════════════════════════════════════════════════════
// ۴. saveProduct — اضافه کردن color_options: localColors به payload
// ══════════════════════════════════════════════════════════
console.log("\n[۴] saveProduct — اضافه کردن color_options به payload...");

// پیدا کردن انتهای payload
const OLD_PAYLOAD_END = `        shipping_type: editForm.shipping_type || "both",
      };`;
const NEW_PAYLOAD_END = `        shipping_type: editForm.shipping_type || "both",
        color_options: localColors,
      };`;

if (src.includes("color_options: localColors,")) {
  console.log("  ✅ قبلاً اضافه شده");
} else if (src.includes(OLD_PAYLOAD_END)) {
  src = src.replace(OLD_PAYLOAD_END, NEW_PAYLOAD_END);
  console.log("  ✅ color_options: localColors به payload اضافه شد");
} else {
  console.log("  ⚠️ الگوی انتهای payload پیدا نشد — جستجو...");
  // پیدا کردن shipping_type در saveProduct
  const saveIdx = src.indexOf("const saveProduct = async");
  if (saveIdx !== -1) {
    const afterSave = src.indexOf('shipping_type: editForm.shipping_type || "both",', saveIdx);
    if (afterSave !== -1) {
      const insertAfter = afterSave + 'shipping_type: editForm.shipping_type || "both",'.length;
      src = src.slice(0, insertAfter) + "\n        color_options: localColors," + src.slice(insertAfter);
      console.log("  ✅ color_options: localColors اضافه شد (روش جایگزین)");
    }
  }
}

// ══════════════════════════════════════════════════════════
// ذخیره
// ══════════════════════════════════════════════════════════
fs.writeFileSync(filePath, src, "utf8");
console.log("\n💾 components/AdminProducts.tsx ذخیره شد");

// تایید تغییرات
console.log("\n📋 تایید تغییرات:");
const lines = src.split("\n");
lines.forEach((l, i) => {
  if (l.includes("color_options") && (l.includes("localColors") || l.includes("p.color_options") || l.includes("hex: string"))) {
    console.log(`  ✅ line ${i+1}: ${l.trim()}`);
  }
});

// ══════════════════════════════════════════════════════════
// Build
// ══════════════════════════════════════════════════════════
console.log("\n🔨 Build...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  console.log("✅ Build موفق!");
} catch (e) {
  console.error("❌ Build ناموفق!");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════
// Git
// ══════════════════════════════════════════════════════════
console.log("\n📤 Git...");
try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  const msg = `fix(AdminProducts): wire color_options to save/load in product form

- Add color_options to FullCatalogProduct interface
- openEdit: load localColors from product.color_options
- openAdd: reset localColors to []
- saveProduct: include color_options: localColors in payload
- Now colors save to DB and reload when editing existing product

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe`;
  execSync(`git commit -m "${msg}"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch (e) {
  console.error("Git:", e.message);
}

console.log("\n✅ fix12.js کامل!");
console.log("📋 خلاصه مشکل:");
console.log("  ❌ قبلاً: saveProduct رنگ‌ها رو به API نمیفرستاد");
console.log("  ✅ الان: color_options: localColors به payload اضافه شد");
console.log("  ✅ الان: openEdit رنگ‌های قبلی رو لود می‌کنه");