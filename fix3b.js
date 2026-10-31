#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

// ── 1. patch layout.tsx import ──────────────────────────────
const layoutPath = path.join(ROOT, "app/layout.tsx");
if (fs.existsSync(layoutPath)) {
  let c = fs.readFileSync(layoutPath, "utf8");
  c = c.replace(
    /@\/components\/layout\/MobileBottomNav/g,
    "@/components/MobileBottomNav"
  );
  fs.writeFileSync(layoutPath, c, "utf8");
  console.log("✅ app/layout.tsx — import path اصلاح شد");
} else {
  console.log("⚠️ layout.tsx پیدا نشد");
}

// ── 2. Build ─────────────────────────────────────────────────
console.log("\n🔨 build ...\n");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("\n❌ بیلد شکست خورد.\n");
  process.exit(1);
}

// ── 3. Git ───────────────────────────────────────────────────
try {
  const msg = path.join(ROOT, ".git", "FIX3B.txt");
  fs.writeFileSync(msg,
    "fix: update layout.tsx import path for MobileBottomNav\n\n" +
    "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\n" +
    "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
    "utf8"
  );
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -F ".git/FIX3B.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit" });
  console.log("✅ push شد!");
} catch (e) {
  console.warn("⚠️ git:", e && e.message ? e.message : String(e));
}

// ── 4. Vercel deploy ─────────────────────────────────────────
console.log("\n🚀 vercel deploy ...\n");
try {
  execSync("npx vercel --prod --yes", { stdio: "inherit" });
  console.log("\n✅ axoncore.ir آپدیت شد!\n");
} catch (e) {
  console.warn("⚠️ vercel:", e && e.message ? e.message : String(e));
}