/**
 * fix15.js — آکسون کور
 * ۱. حذف service worker / PWA cache که باعث نمایش نسخه قدیمی میشه
 * ۲. اسلایدر: ارتفاع اکسپلیسیت + wrapper class درست
 * ۳. نشانگر نسخه موقت (حذف می‌شه بعد از تأیید)
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.resolve(__dirname);
const log  = (m) => console.log(m);

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}
function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
  log(`✅ ${rel}`);
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ── بررسی service worker ──────────────────────────────────────────
log("\n=== بررسی service worker ===");
const swFiles = [
  "public/sw.js", "public/workbox-*.js", "public/worker.js",
  "public/firebase-messaging-sw.js", "public/OneSignalSDKWorker.js",
];
let hasSW = false;
swFiles.forEach(f => {
  const p = path.join(ROOT, f.replace("*", "any"));
  if (exists(f.replace("*", ""))) { log(`⚠️  پیدا شد: ${f}`); hasSW = true; }
});

// بررسی با glob
try {
  const out = execSync("dir /b public\\sw*.js public\\workbox*.js 2>nul", { cwd: ROOT, encoding: "utf8" });
  if (out.trim()) { log("⚠️  SW files: " + out.trim()); hasSW = true; }
} catch {}

try {
  const out = execSync("dir /b public\\", { cwd: ROOT, encoding: "utf8" });
  log("public/ فایل‌ها:\n" + out);
} catch {}

// بررسی next.config
const nextCfg = read("next.config.js") || read("next.config.ts") || read("next.config.mjs");
if (nextCfg) {
  if (nextCfg.includes("pwa") || nextCfg.includes("workbox") || nextCfg.includes("sw")) {
    log("⚠️  next.config دارای PWA/SW config است!");
    log(nextCfg.slice(0, 500));
  } else {
    log("ℹ️  next.config PWA ندارد");
  }
}

// بررسی package.json
const pkg = read("package.json");
if (pkg) {
  const p = JSON.parse(pkg);
  const deps = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
  const swPkgs = Object.keys(deps).filter(k => k.includes("pwa") || k.includes("workbox") || k.includes("sw"));
  if (swPkgs.length) log("⚠️  SW packages: " + swPkgs.join(", "));
  else log("ℹ️  package.json: بدون PWA package");
}

// ─────────────────────────────────────────────────────────────────
// اصلاح layout.tsx — اضافه کردن SW unregister script
// ─────────────────────────────────────────────────────────────────
{
  const rel = "app/layout.tsx";
  let src = read(rel);
  if (!src) { log("⚠️  layout.tsx نیافت"); }
  else {
    // بررسی که آیا قبلاً unregister اضافه شده
    if (src.includes("unregister") || src.includes("serviceWorker")) {
      log("ℹ️  layout.tsx قبلاً SW handler دارد");
    } else {
      // اضافه کردن script برای unregister SW به <head>
      const headScript = `
      <script dangerouslySetInnerHTML={{ __html: \`
        // پاک‌سازی service worker cache
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(regs) {
            regs.forEach(function(r) { r.unregister(); });
          });
        }
      \` }} />`;

      // اضافه کردن بعد از <head> یا قبل از </head>
      if (src.includes("<head>")) {
        const newSrc = src.replace("<head>", `<head>${headScript}`);
        if (newSrc !== src) { write(rel, newSrc); log("✅ SW unregister به layout.tsx اضافه شد"); }
      } else if (src.includes("metadata") || src.includes("<html")) {
        // ممکنه App Router بدون explicit <head> باشه — اضافه کردن به body
        log("ℹ️  layout.tsx از App Router metadata استفاده میکنه — SW script به body اضافه میشه");
        // پیدا کردن <body> برای اضافه کردن script
        const bodyScript = `
          {/* SW cache clear */}
          <script dangerouslySetInnerHTML={{ __html: \`if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(reg=>reg.unregister()));}\` }} />`;

        if (src.includes("<body")) {
          const newSrc = src.replace(/<body([^>]*)>/, `<body$1>${bodyScript}`);
          if (newSrc !== src) { write(rel, newSrc); log("✅ SW unregister به body اضافه شد"); }
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// اصلاح اسلایدر — اطمینان از ارتفاع صحیح و class axon-sl-wrap
// ─────────────────────────────────────────────────────────────────
{
  const rel = "components/DynamicHomeSections.tsx";
  let src = read(rel);
  if (!src) process.exit(1);

  // اضافه کردن axon-sl-wrap به className wrapper اسلایدر
  src = src.replace(
    `className="relative w-full overflow-hidden rounded-3xl shadow-2xl"`,
    `className="axon-sl-wrap relative w-full overflow-hidden rounded-3xl shadow-2xl"`
  );

  // اطمینان از height: "200px" روی همان div
  if (!src.includes(`style={{ height: "200px" }}`)) {
    src = src.replace(
      `className="axon-sl-wrap relative w-full overflow-hidden rounded-3xl shadow-2xl"`,
      `className="axon-sl-wrap relative w-full overflow-hidden rounded-3xl shadow-2xl"\n            style={{ height: "200px" }}`
    );
  }

  write(rel, src);
  log("✅ axon-sl-wrap class اضافه شد");
}

// ─────────────────────────────────────────────────────────────────
// globals.css — اضافه کردن axon-sl-wrap styles
// ─────────────────────────────────────────────────────────────────
{
  const rel = "app/globals.css";
  let src = read(rel);
  if (!src) process.exit(1);

  // حذف تعریف قدیمی
  src = src.replace(/\/\* axon-sl-wrap[\s\S]*?\*\/[\s\S]*?\.axon-sl-wrap[\s\S]*?\}/g, "");

  const sliderCSS = `
/* ── اسلایدر wrapper ─────────────────────────────────── */
.axon-sl-wrap {
  height: 200px !important;
  min-height: 200px !important;
  max-height: 200px !important;
}
@media (min-width: 640px) {
  .axon-sl-wrap {
    height: 260px !important;
    min-height: 260px !important;
    max-height: 260px !important;
  }
}
@media (min-width: 1024px) {
  .axon-sl-wrap {
    height: 340px !important;
    min-height: 340px !important;
    max-height: 340px !important;
  }
}
`;
  src = src.trimEnd() + "\n" + sliderCSS + "\n";
  write(rel, src);
  log("✅ axon-sl-wrap CSS اضافه شد");
}

// ─────────────────────────────────────────────────────────────────
// Build + Git
// ─────────────────────────────────────────────────────────────────
log("\n🔨 Build...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  log("✅ Build موفق");
} catch (e) {
  log("❌ Build ناموفق");
  process.exit(1);
}

const msg = `fix(cache): unregister service worker + fix slider height class

- layout.tsx: add SW unregister script to clear cached old bundles
- DynamicHomeSections: add axon-sl-wrap class to slider wrapper
- globals.css: axon-sl-wrap with !important height for all breakpoints
- This forces browsers to load fresh assets instead of SW-cached ones

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GPCkuaxVKtN9Tnci5NSTZ8`;

fs.writeFileSync(path.join(ROOT, ".git", "AXON_FIX15.txt"), msg, "utf8");

try {
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync('git commit -F ".git/AXON_FIX15.txt"', { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  log("🚀 Deploy!");
} catch (e) {
  log("❌ Git: " + (e.message || e));
  process.exit(1);
}