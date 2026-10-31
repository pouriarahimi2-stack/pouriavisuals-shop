#!/usr/bin/env node
// fix11.js — اصلاح ai-chat-float-btn در globals.css + TSX fallback
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

// ─── ۱. پیدا کردن globals.css ──────────────────────────────
const cssCandidates = [
  "app/globals.css",
  "styles/globals.css",
  "src/app/globals.css",
  "src/styles/globals.css",
];
let cssFile = null;
for (const c of cssCandidates) {
  const abs = path.join(ROOT, c);
  if (fs.existsSync(abs)) { cssFile = abs; break; }
}

if (!cssFile) {
  // جستجو در کل پروژه
  const find = (dir) => {
    const es = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of es) {
      if (["node_modules",".next",".git"].includes(e.name)) continue;
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) { const r = find(fp); if (r) return r; }
      else if (e.name.endsWith(".css")) return fp;
    }
  };
  cssFile = find(ROOT);
}

console.log("📁 CSS file:", cssFile ? cssFile.replace(ROOT + path.sep, "") : "نیافت");

// ─── ۲. نشون دادن تعریف ai-chat-float-btn در CSS ──────────
if (cssFile) {
  const css = fs.readFileSync(cssFile, "utf8");
  const lines = css.split("\n");
  console.log("\n=== ai-chat-float-btn در CSS ===");
  lines.forEach((l, i) => {
    if (l.includes("ai-chat-float-btn")) {
      const from = Math.max(0, i - 1);
      const to   = Math.min(lines.length, i + 20);
      lines.slice(from, to).forEach((ll, ii) => console.log(`  ${from+ii+1}: ${ll}`));
    }
  });

  // ─── ۳. اصلاح CSS ──────────────────────────────────────
  let newCss = css;
  newCss = newCss.replace(
    /\.ai-chat-float-btn\s*\{([^}]*)\}/gs,
    (match, body) => {
      console.log("\nOLD body:", body.trim());
      let nb = body
        // bottom کوچیک رو بزرگ کن
        .replace(/bottom:\s*[\d.]+px/g,    "bottom: 96px")
        .replace(/bottom:\s*[\d.]+rem/g,   "bottom: 6rem")
        // left رو به right تبدیل کن (RTL)
        .replace(/left:\s*[\d.]+px/g,      "right: 16px")
        .replace(/left:\s*[\d.]+rem/g,     "right: 1rem");
      // اگه bottom نبود اضافه کن
      if (!nb.includes("bottom:")) nb += "\n  bottom: 96px;";
      // اگه right/left نبود اضافه کن
      if (!nb.includes("right:") && !nb.includes("left:")) nb += "\n  right: 16px;";
      console.log("NEW body:", nb.trim());
      return `.ai-chat-float-btn {${nb}}`;
    }
  );

  if (newCss !== css) {
    fs.writeFileSync(cssFile, newCss, "utf8");
    console.log("✅ globals.css — ai-chat-float-btn اصلاح شد");
  } else {
    console.log("ℹ️  CSS pattern کامل نبود — TSX fallback اعمال می‌شه");
  }
}

// ─── ۴. TSX fallback — اضافه کردن style مستقیم به button ──
{
  const tsxPath = path.join(ROOT, "components/AIAssistantChat.tsx");
  let tsx = fs.readFileSync(tsxPath, "utf8");

  // جایگزینی className تنها با className + style
  const OLD_BTN = `        className="ai-chat-float-btn"`;
  const NEW_BTN = `        className="ai-chat-float-btn"
        style={{ position: "fixed", bottom: "96px", right: "16px", zIndex: 50 }}`;

  if (tsx.includes(OLD_BTN) && !tsx.includes("bottom: \"96px\"")) {
    tsx = tsx.replace(OLD_BTN, NEW_BTN);
    fs.writeFileSync(tsxPath, tsx, "utf8");
    console.log("✅ AIAssistantChat — inline style اضافه شد (bottom:96px right:16px)");
  } else if (tsx.includes("bottom: \"96px\"")) {
    console.log("ℹ️  AIAssistantChat — inline style قبلاً اعمال شده");
  } else {
    // fallback: پیدا کردن button با className="ai-chat-float-btn"
    tsx = tsx.replace(
      /className="ai-chat-float-btn"/,
      `className="ai-chat-float-btn" style={{ position: "fixed", bottom: "96px", right: "16px", zIndex: 50 }}`
    );
    fs.writeFileSync(tsxPath, tsx, "utf8");
    console.log("✅ AIAssistantChat — style inline applied");
  }
}

// ─── ۵. Build ──────────────────────────────────────────────
console.log("\n🔨 build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("❌ بیلد شکست");
  process.exit(1);
}

// ─── ۶. Git ────────────────────────────────────────────────
const msgFile = path.join(ROOT, ".git", "FIX11.txt");
fs.writeFileSync(msgFile, [
  "fix(ui): chat button position fixed bottom-24 right-4",
  "",
  "- globals.css .ai-chat-float-btn: bottom 96px, right 16px",
  "- AIAssistantChat.tsx: inline style fallback for position",
  "  clears MobileBottomNav (56px) and product card area",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
].join("\n"), "utf8");

execSync("git add -A",                     { stdio: "inherit", cwd: ROOT });
execSync('git commit -F ".git/FIX11.txt"', { stdio: "inherit", cwd: ROOT });
execSync("git push origin main",           { stdio: "inherit", cwd: ROOT });
console.log("✅ push شد!");