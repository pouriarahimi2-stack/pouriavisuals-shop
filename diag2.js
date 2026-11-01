/**
 * diag2.js — دیاگ کامل تمام مشکلات موبایل
 */
const fs   = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname);

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return `[NOT FOUND: ${rel}]`;
  return fs.readFileSync(p, "utf8");
}
function section(title, content) {
  console.log("\n" + "=".repeat(60));
  console.log("=== " + title);
  console.log("=".repeat(60));
  console.log(content);
}
function lines(src, from, to) {
  return src.split("\n").slice(from-1, to).map((l,i) => `${from+i}: ${l}`).join("\n");
}
function findLine(src, keyword) {
  const idx = src.indexOf(keyword);
  if (idx === -1) return -1;
  return src.slice(0, idx).split("\n").length;
}

// ─────────────────────────────────────────────────
// 1. AddToCartButton.tsx — کامل
// ─────────────────────────────────────────────────
{
  const src = read("components/AddToCartButton.tsx");
  const total = src.split("\n").length;
  section("AddToCartButton.tsx — کامل (" + total + " خط)", src);
}

// ─────────────────────────────────────────────────
// 2. ProductCard.tsx — کامل
// ─────────────────────────────────────────────────
{
  const src = read("components/ProductCard.tsx");
  const total = src.split("\n").length;
  section("ProductCard.tsx — کامل (" + total + " خط)", src);
}

// ─────────────────────────────────────────────────
// 3. MobileBottomNav.tsx — کامل
// ─────────────────────────────────────────────────
{
  const src = read("components/MobileBottomNav.tsx");
  section("MobileBottomNav.tsx", src);
}

// ─────────────────────────────────────────────────
// 4. AIAssistantChat.tsx — کامل
// ─────────────────────────────────────────────────
{
  const src = read("components/AIAssistantChat.tsx");
  section("AIAssistantChat.tsx", src);
}

// ─────────────────────────────────────────────────
// 5. ProductDetailClient.tsx — بخش sticky bar
// ─────────────────────────────────────────────────
{
  const src = read("components/ProductDetailClient.tsx");
  // پیدا کردن sticky/fixed bar
  const li = findLine(src, "sticky") || findLine(src, "fixed bottom") || findLine(src, "bottom-");
  if (li > 0) {
    section("ProductDetailClient.tsx — sticky bar (خطوط " + Math.max(1,li-5) + "-" + (li+40) + ")",
      lines(src, Math.max(1,li-5), li+40));
  }
  // آخرین ۵۰ خط
  const all = src.split("\n");
  section("ProductDetailClient.tsx — آخرین ۵۰ خط",
    all.slice(-50).map((l,i) => `${all.length-50+i+1}: ${l}`).join("\n"));
}

// ─────────────────────────────────────────────────
// 6. DynamicHomeSections.tsx — اسلایدر کامل
// ─────────────────────────────────────────────────
{
  const src = read("components/DynamicHomeSections.tsx");
  const si = findLine(src, 'sec.type === "banners_slider"');
  // دومین بار که banners_slider ظاهر میشه (render block)
  const allLines = src.split("\n");
  let count = 0;
  let renderLine = -1;
  allLines.forEach((l, i) => {
    if (l.includes('banners_slider')) {
      count++;
      if (count === 2) renderLine = i + 1;
    }
  });
  if (renderLine > 0) {
    section("DynamicHomeSections.tsx — render block (خطوط " + renderLine + "-" + (renderLine+80) + ")",
      lines(src, renderLine, renderLine+80));
  }
}

// ─────────────────────────────────────────────────
// 7. globals.css — تمام کلاس‌های مرتبط
// ─────────────────────────────────────────────────
{
  const src = read("app/globals.css");
  // پیدا کردن card-glass, btn-glass, bottom-nav, chat, axon-sl
  const relevant = src.split("\n").filter((l, i) => {
    return l.includes("card-glass") || l.includes("btn-glass") ||
           l.includes("ai-chat") || l.includes("axon-sl") ||
           l.includes("MobileBottom") || l.includes("bottom-nav") ||
           l.includes("AddToCart") || l.includes("product-card") ||
           l.includes("pb-") || l.includes("safe-area");
  });
  section("globals.css — کلاس‌های مرتبط", relevant.join("\n"));

  // آخرین ۵۰ خط
  const all = src.split("\n");
  section("globals.css — آخرین ۵۰ خط",
    all.slice(-50).map((l,i) => `${all.length-50+i+1}: ${l}`).join("\n"));
}

// ─────────────────────────────────────────────────
// 8. app/layout.tsx — آخرین نسخه
// ─────────────────────────────────────────────────
{
  const src = read("app/layout.tsx");
  section("app/layout.tsx", src);
}

// ─────────────────────────────────────────────────
// 9. بررسی import‌های layout
// ─────────────────────────────────────────────────
{
  const src = read("app/layout.tsx");
  const imports = src.split("\n").filter(l => l.startsWith("import") || l.includes("from \""));
  section("layout.tsx — imports", imports.join("\n"));
}

console.log("\n✅ دیاگ کامل شد");