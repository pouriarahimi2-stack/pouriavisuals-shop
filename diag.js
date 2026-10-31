/**
 * diag.js — تشخیص وضعیت فعلی فایل‌ها
 */
const fs   = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname);

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log(`NOT FOUND: ${rel}`); return null; }
  return fs.readFileSync(p, "utf8");
}

// ── DynamicHomeSections ────────────────────────────────────────────
const dhs = read("components/DynamicHomeSections.tsx");
if (dhs) {
  const lines = dhs.split("\n");
  // پیدا کردن banners_slider
  lines.forEach((l, i) => {
    if (l.includes("banners_slider") || l.includes("axon-sl") || l.includes("GRADS") || l.includes("axon-hero")) {
      console.log(`DHS ${i+1}: ${l}`);
    }
  });
  // نمایش ۱۰ خط اول banners_slider block
  const si = dhs.indexOf('sec.type === "banners_slider"');
  if (si !== -1) {
    const lineNum = dhs.slice(0, si).split("\n").length;
    console.log(`\n=== banners_slider block از خط ${lineNum} ===`);
    lines.slice(lineNum - 1, lineNum + 30).forEach((l, i) => console.log(`${lineNum + i}: ${l}`));
  }
}

// ── getDeviceVisibilityClasses ─────────────────────────────────────
if (dhs) {
  const si = dhs.indexOf("getDeviceVisibilityClasses");
  if (si !== -1) {
    const lineNum = dhs.slice(0, si).split("\n").length;
    console.log(`\n=== getDeviceVisibilityClasses از خط ${lineNum} ===`);
    const lines2 = dhs.split("\n");
    lines2.slice(lineNum - 1, lineNum + 30).forEach((l, i) => console.log(`${lineNum + i}: ${l}`));
  }
}

// ── AIAssistantChat bottom ─────────────────────────────────────────
const chat = read("components/AIAssistantChat.tsx");
if (chat) {
  const lines = chat.split("\n").slice(48, 57);
  console.log("\n=== AIAssistantChat خط ۴۹-۵۶ ===");
  lines.forEach((l, i) => console.log(`${49+i}: ${l}`));
}

// ── globals.css آخرین ۳۰ خط ─────────────────────────────────────
const css = read("app/globals.css");
if (css) {
  const lines = css.split("\n");
  console.log("\n=== globals.css آخرین ۳۰ خط ===");
  lines.slice(-30).forEach((l, i) => console.log(`${lines.length-30+i+1}: ${l}`));
}