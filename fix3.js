// fix3.js — patch parsePrice + fuzzyMatchImages در AdminProducts.tsx
// node fix3.js

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findRoot(dir) {
  if (fs.existsSync(path.join(dir, "package.json"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) throw new Error("package.json پیدا نشد!");
  return findRoot(parent);
}
const ROOT = findRoot(__dirname);
const TARGET = path.join(ROOT, "components", "AdminProducts.tsx");

console.log("📁 پروژه:", ROOT);
let src = fs.readFileSync(TARGET, "utf8");

// ─── patch 1: parsePrice ─────────────────────────────────────────────────────
// مشکل: 2.800.000 (نقطه فارسی هزارگان) → باید نقطه‌ها حذف بشن
const OLD_PARSE = `function parsePrice(val: any): number {
  if (!val) return 0;
  const s = String(val).replace(/[,،٬\\s]/g,"").replace(/[۰-۹]/g, d => String(d.charCodeAt(0)-1632));
  return Number(s) || 0;
}`;

const NEW_PARSE = `function parsePrice(val: any): number {
  if (!val) return 0;
  let s = String(val).trim()
    // ارقام فارسی/عربی به انگلیسی
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
    // حذف کاما و فاصله
    .replace(/[,،٬\\s]/g, "");
  // نقطه به عنوان جداکننده هزارگان فارسی (مثل 2.800.000)
  const dotCount = (s.match(/\\./g) || []).length;
  if (dotCount > 1) {
    // چند نقطه → همه جداکننده هزارگان هستن
    s = s.replace(/\\./g, "");
  } else if (dotCount === 1 && /\\.\\d{3}$/.test(s)) {
    // یه نقطه + دقیقاً ۳ رقم بعدش → جداکننده هزارگان (مثل 2.800)
    s = s.replace(".", "");
  }
  return Number(s) || 0;
}`;

if (src.includes(OLD_PARSE)) {
  src = src.replace(OLD_PARSE, NEW_PARSE);
  console.log("✅ parsePrice پچ شد — نقطه فارسی هزارگان رفع شد");
} else {
  console.error("❌ OLD_PARSE پیدا نشد — احتمالاً قبلاً پچ شده یا کد عوض شده");
  process.exit(1);
}

// ─── patch 2: fuzzyMatchImages ───────────────────────────────────────────────
// مشکل: فایل‌های thumb.jpg انتخاب میشن + matching بر اساس شماره photo
const OLD_FUZZY = `function fuzzyMatchImages(allFiles: File[], photoField: string | null, sku: string): File[] {
  const result: File[] = [];
  const seen = new Set<string>();
  const addFile = (f: File) => { if (!seen.has(f.name)) { seen.add(f.name); result.push(f); } };
  if (photoField) {
    const names = photoField.split(/[,،;]/).map((s: string) => s.trim()).filter(Boolean);
    for (const name of names) {
      const nl = name.toLowerCase();
      const noExt = nl.replace(/\\.[^.]+$/, "");
      const found =
        allFiles.find(f => f.name === name) ||
        allFiles.find(f => f.name.toLowerCase() === nl) ||
        allFiles.find(f => f.name.toLowerCase().replace(/\\.[^.]+$/, "") === noExt);
      if (found) addFile(found);
    }
  }
  if (sku) {
    const skuL = sku.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (skuL.length >= 3) {
      allFiles.forEach(f => {
        const fnl = f.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (fnl.startsWith(skuL)) addFile(f);
      });
    }
  }
  return result;
}`;

const NEW_FUZZY = `function fuzzyMatchImages(allFiles: File[], photoField: string | null, sku: string): File[] {
  // فیلتر: فایل‌های thumb را حذف کن (photo_60@...thumb.jpg)
  const mainFiles = allFiles.filter(f =>
    !f.name.toLowerCase().includes(".thumb.") &&
    !f.name.toLowerCase().endsWith(".thumb")
  );
  const result: File[] = [];
  const seen = new Set<string>();
  const addFile = (f: File) => { if (!seen.has(f.name)) { seen.add(f.name); result.push(f); } };

  if (photoField) {
    const names = photoField.split(/[,،;]/).map((s: string) => s.trim()).filter(Boolean);
    for (const name of names) {
      const nl = name.toLowerCase();
      const noExt = nl.replace(/\\.[^.]+$/, "");
      // استخراج شماره photo از الگوی photo_60@تاریخ
      const photoNumMatch = noExt.match(/^(photo_)(\\d+)/);
      const photoNum = photoNumMatch ? photoNumMatch[2] : null;

      const found =
        // ۱. تطابق دقیق
        mainFiles.find(f => f.name === name) ||
        // ۲. تطابق بدون حساسیت به کوچک/بزرگ
        mainFiles.find(f => f.name.toLowerCase() === nl) ||
        // ۳. تطابق بدون پسوند
        mainFiles.find(f => f.name.toLowerCase().replace(/\\.[^.]+$/, "") === noExt) ||
        // ۴. تطابق بر اساس شماره photo (photo_60@هر تاریخی)
        (photoNum ? mainFiles.find(f => {
          const fn = f.name.toLowerCase().replace(/\\.[^.]+$/, "");
          const m = fn.match(/^photo_(\\d+)/);
          return m && m[1] === photoNum;
        }) : undefined);

      if (found) addFile(found);
    }
  }

  if (sku) {
    const skuL = sku.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (skuL.length >= 3) {
      mainFiles.forEach(f => {
        const fnl = f.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (fnl.startsWith(skuL)) addFile(f);
      });
    }
  }
  return result;
}`;

if (src.includes(OLD_FUZZY)) {
  src = src.replace(OLD_FUZZY, NEW_FUZZY);
  console.log("✅ fuzzyMatchImages پچ شد — thumb فیلتر + matching بر اساس شماره photo");
} else {
  console.error("❌ OLD_FUZZY پیدا نشد — احتمالاً کد عوض شده");
  process.exit(1);
}

fs.writeFileSync(TARGET, src, "utf8");
console.log("💾 فایل نوشته شد:", TARGET);

console.log("🔨 npm run build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("✅ Build موفق!");
} catch {
  console.error("❌ Build شکست");
  process.exit(1);
}

try {
  execSync("git add components/AdminProducts.tsx", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m "fix(admin): parsePrice dots + fuzzyMatchImages thumb filter

- parsePrice: رفع مشکل قیمت‌های با نقطه فارسی (2.800.000)
- fuzzyMatchImages: فیلتر فایل‌های .thumb.jpg
- fuzzyMatchImages: matching بر اساس شماره photo_ (photo_60@هر تاریخ)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("🚀 Push موفق!");
} catch(e) {
  console.error("⚠️ خطا در git:", e.message);
}