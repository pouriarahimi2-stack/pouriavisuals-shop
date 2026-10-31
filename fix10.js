#!/usr/bin/env node
// fix10.js — پیدا کردن و اصلاح ai-chat-float-btn CSS
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

// ─── پیدا کردن ai-chat-float-btn در همه فایل‌ها ──────────────
let foundFiles = [];
const scan = (dir) => {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scan(full);
    } else if (/\.(css|scss|tsx|ts|jsx|js)$/.test(e.name)) {
      try {
        const c = fs.readFileSync(full, "utf8");
        if (c.includes("ai-chat-float-btn")) {
          foundFiles.push(full);
          console.log("📍 یافت:", full.replace(ROOT + path.sep, ""));
          c.split("\n").forEach((l, i) => {
            if (l.includes("ai-chat-float-btn") || (l.includes("bottom") && foundFiles.length > 0) || l.includes("left") || l.includes("right") || l.includes("position")) {
              // فقط خطوط نزدیک به ai-chat-float-btn
            }
          });
          // نمایش ۳۰ خط قبل و بعد از تعریف
          const lines = c.split("\n");
          lines.forEach((l, i) => {
            if (l.includes("ai-chat-float-btn")) {
              const from = Math.max(0, i - 2);
              const to   = Math.min(lines.length, i + 25);
              console.log("--- خطوط " + (from+1) + " تا " + to + " ---");
              lines.slice(from, to).forEach((ll, ii) => console.log(`  ${from+ii+1}: ${ll}`));
            }
          });
        }
      } catch {}
    }
  }
};
scan(ROOT);

if (foundFiles.length === 0) {
  console.log("⚠️  ai-chat-float-btn در هیچ فایلی پیدا نشد");
  process.exit(0);
}

// ─── اصلاح هر فایل ──────────────────────────────────────────
for (const fp of foundFiles) {
  let c = fs.readFileSync(fp, "utf8");

  if (fp.endsWith(".css") || fp.endsWith(".scss")) {
    // اصلاح CSS مستقیم
    // bottom: Xpx  →  bottom: 96px  (بالاتر از کارت‌ها)
    // left: Xpx    →  right: 16px   (سمت راست RTL)
    c = c.replace(
      /\.ai-chat-float-btn\s*\{([^}]*)\}/gs,
      (match, body) => {
        let newBody = body
          .replace(/bottom:\s*[\d.]+(?:px|rem|em|vh)?/g, "bottom: 96px")
          .replace(/left:\s*[\d.]+(?:px|rem|em|vh)?/g,   "right: 16px")
          .replace(/right:\s*[\d.]+(?:px|rem|em|vh)?/g,  "right: 16px");
        // اضافه کردن bottom اگه نداشت
        if (!newBody.includes("bottom:")) newBody += "\n  bottom: 96px;";
        if (!newBody.includes("right:")  && !newBody.includes("left:")) newBody += "\n  right: 16px;";
        return `.ai-chat-float-btn {${newBody}}`;
      }
    );
    console.log("✅ CSS اصلاح شد:", fp.replace(ROOT + path.sep, ""));
  } else {
    // فایل TSX/JS — شاید inline style یا className داخل JSX
    c = c
      .replace(/["']ai-chat-float-btn["']/g, '"ai-chat-float-btn"') // normalize
      // اگر style prop داره
      .replace(/style=\{\{([^}]*?)bottom:\s*[\d.]+(?:px|rem)?([^}]*?)\}\}/g,
        (m, a, b) => `style={{ ${a}bottom: 96${b} }}`);
    console.log("✅ TSX اصلاح شد:", fp.replace(ROOT + path.sep, ""));
  }

  fs.writeFileSync(fp, c, "utf8");
}

// ─── Build ──────────────────────────────────────────────────
console.log("\n🔨 build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("❌ بیلد شکست");
  process.exit(1);
}

// ─── Git ────────────────────────────────────────────────────
const msgFile = path.join(ROOT, ".git", "FIX10.txt");
fs.writeFileSync(msgFile, [
  "fix(ui): ai-chat-float-btn repositioned above product cards",
  "",
  "- ai-chat-float-btn CSS: bottom 96px, right 16px",
  "  clears MobileBottomNav (56px) + product card buttons",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
].join("\n"), "utf8");

execSync("git add -A",                     { stdio: "inherit", cwd: ROOT });
execSync('git commit -F ".git/FIX10.txt"', { stdio: "inherit", cwd: ROOT });
execSync("git push origin main",           { stdio: "inherit", cwd: ROOT });
console.log("✅ push شد!");