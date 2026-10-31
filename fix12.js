#!/usr/bin/env node
// fix12.js — خواندن وضعیت فعلی + اصلاح قطعی اسلایدر
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

const dynPath = path.join(ROOT, "components/DynamicHomeSections.tsx");
let src = fs.readFileSync(dynPath, "utf8");

// ── نشون دادن خطوط ۲۲۰ تا ۳۵۰ ──────────────────────────────
console.log("=== DynamicHomeSections — خطوط ۲۲۰-۳۵۰ ===");
src.split("\n").slice(219, 350).forEach((l, i) => console.log(`${220+i}: ${l}`));

// ── خواندن globals.css برای .ai-chat-float-btn ──────────────
const cssPath = path.join(ROOT, "app/globals.css");
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, "utf8");
  if (css.includes("ai-chat-float-btn")) {
    console.log("\n=== globals.css — ai-chat-float-btn ===");
    css.split("\n").forEach((l, i) => {
      if (l.includes("ai-chat-float-btn")) {
        css.split("\n").slice(Math.max(0, i-1), i+20).forEach((ll, ii) =>
          console.log(`  ${Math.max(0,i-1)+ii+1}: ${ll}`)
        );
      }
    });
  } else {
    console.log("\n⚠️  ai-chat-float-btn در globals.css نیست");
    // جستجو در کل globals.css برای chat/float
    console.log("=== chat/float classes ===");
    css.split("\n").forEach((l, i) => {
      if (l.toLowerCase().includes("chat") || l.includes("float")) {
        console.log(`  ${i+1}: ${l}`);
      }
    });
  }
}