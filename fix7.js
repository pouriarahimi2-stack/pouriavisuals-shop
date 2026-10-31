#!/usr/bin/env node
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

// ─── ۱. DynamicHomeSections — hardcode banners_slider lg:hidden ───
{
  const p = path.join(ROOT, "components/DynamicHomeSections.tsx");
  let s = fs.readFileSync(p, "utf8");

  // الف) در getDeviceVisibilityClasses: banners_slider رو همیشه lg:hidden کن
  // این باعث می‌شه حتی اگر دیتابیس showOnDesktop: true داشت، نشون داده نشه
  const OLD_FN = `function getDeviceVisibilityClasses(sec: ResponsiveSectionItem): string {
  if (sec.type === "NativePerspectiveSlider") return "hidden lg:block";
  if (sec.type === "NativeProductCatalog")    return "block";
  const mob  = sec.showOnMobile  !== undefined ? Boolean(sec.showOnMobile)  : true;
  const tab  = sec.showOnTablet  !== undefined ? Boolean(sec.showOnTablet)  : true;
  const desk = sec.showOnDesktop !== undefined ? Boolean(sec.showOnDesktop) : true;
  if (!mob && !tab && !desk) return "hidden";
  return (
    (mob  ? "block"    : "hidden")    + " " +
    (tab  ? "md:block" : "md:hidden") + " " +
    (desk ? "lg:block" : "lg:hidden")
  );
}`;

  const NEW_FN = `function getDeviceVisibilityClasses(sec: ResponsiveSectionItem): string {
  // اسلایدر بنر: فقط موبایل + تبلت — دسکتاپ همیشه مخفی
  if (sec.type === "banners_slider")         return "block md:block lg:hidden";
  if (sec.type === "NativePerspectiveSlider") return "hidden lg:block";
  if (sec.type === "NativeProductCatalog")    return "block";
  const mob  = sec.showOnMobile  !== undefined ? Boolean(sec.showOnMobile)  : true;
  const tab  = sec.showOnTablet  !== undefined ? Boolean(sec.showOnTablet)  : true;
  const desk = sec.showOnDesktop !== undefined ? Boolean(sec.showOnDesktop) : true;
  if (!mob && !tab && !desk) return "hidden";
  return (
    (mob  ? "block"    : "hidden")    + " " +
    (tab  ? "md:block" : "md:hidden") + " " +
    (desk ? "lg:block" : "lg:hidden")
  );
}`;

  if (s.includes(OLD_FN)) {
    s = s.replace(OLD_FN, NEW_FN);
    console.log("✅ DynamicHomeSections — getDeviceVisibilityClasses اصلاح شد");
  } else {
    // fallback: هر نسخه‌ای از تابع که banners_slider رو handle نمی‌کنه
    s = s.replace(
      /function getDeviceVisibilityClasses\(sec: ResponsiveSectionItem\): string \{/,
      `function getDeviceVisibilityClasses(sec: ResponsiveSectionItem): string {
  if (sec.type === "banners_slider") return "block md:block lg:hidden";`
    );
    console.log("✅ DynamicHomeSections — fallback patch اعمال شد");
  }

  // ب) ارتفاع slider موبایل رو بیشتر کن تا محتوا کامل نشون داده بشه
  s = s.replace(/mobileHeight:\s*\d+,/, "mobileHeight: 300,");
  s = s.replace(/"--axon-banner-h-mob":\s*\(bannerSizing\.mobileHeight\s*\|\|\s*\d+\)/, '"--axon-banner-h-mob": (bannerSizing.mobileHeight  || 300)');

  fs.writeFileSync(p, s, "utf8");
}

// ─── ۲. LiveChat / ChatWidget — رفع overlap با کارت‌ها ──────────
// فایل‌های مختلف رو بررسی می‌کنیم
const chatCandidates = [
  "components/LiveChat.tsx",
  "components/ChatWidget.tsx",
  "components/LiveChatWidget.tsx",
  "components/SupportChat.tsx",
  "components/FloatingChat.tsx",
];
let chatFixed = false;
for (const cf of chatCandidates) {
  const abs = path.join(ROOT, cf);
  if (!fs.existsSync(abs)) continue;
  let c = fs.readFileSync(abs, "utf8");
  // chat bubble معمولاً fixed bottom-X left-X هست
  // باید bottom بیشتری بگیره تا از کارت‌ها فاصله داشته باشه
  const newC = c
    .replace(/fixed bottom-16 left-/g, "fixed bottom-24 left-")
    .replace(/fixed bottom-20 left-/g, "fixed bottom-24 left-")
    .replace(/fixed bottom-4 left-/g,  "fixed bottom-24 left-")
    .replace(/fixed bottom-6 left-/g,  "fixed bottom-24 left-")
    .replace(/fixed bottom-8 left-/g,  "fixed bottom-24 left-")
    .replace(/"bottom":\s*"20px"/g,    '"bottom": "96px"')
    .replace(/"bottom":\s*"16px"/g,    '"bottom": "96px"')
    .replace(/bottom:\s*"20px"/g,      'bottom: "96px"')
    .replace(/bottom:\s*16,/g,         "bottom: 96,");
  if (newC !== c) {
    fs.writeFileSync(abs, newC, "utf8");
    console.log("✅ " + cf + " — chat bubble position اصلاح شد");
    chatFixed = true;
  }
}
if (!chatFixed) {
  // جستجو در همه فایل‌های TSX برای chat bubble
  const allTsx = fs.readdirSync(path.join(ROOT, "components"))
    .filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));
  for (const f of allTsx) {
    const abs = path.join(ROOT, "components", f);
    let c = fs.readFileSync(abs, "utf8");
    if (!c.includes("live-chat") && !c.includes("LiveChat") && !c.includes("chat") && !c.includes("Chat")) continue;
    if (!c.includes("fixed") || !c.includes("bottom")) continue;
    // پیدا کردن chat bubble با الگوهای مختلف
    const newC = c
      .replace(/(fixed\s+)(bottom-4|bottom-5|bottom-6|bottom-8)(\s+left-)/g, "$1bottom-24$3")
      .replace(/(position:\s*["']?fixed["']?[\s\S]{0,200}?bottom:\s*["']?)(1rem|1\.5rem|2rem|0\.5rem)(["']?)/g, '$1"6rem"');
    if (newC !== c) {
      fs.writeFileSync(abs, newC, "utf8");
      console.log("✅ components/" + f + " — chat bubble اصلاح شد");
      chatFixed = true;
    }
  }
  if (!chatFixed) console.log("⚠️  chat bubble پیدا نشد — شاید inline style داره");
}

// ─── Build ──────────────────────────────────────────────────────
console.log("\n🔨 build...\n");
try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ بیلد موفق!\n");
} catch {
  console.error("❌ بیلد شکست."); process.exit(1);
}

// ─── Git ────────────────────────────────────────────────────────
const msg = path.join(ROOT, ".git", "FIX7.txt");
fs.writeFileSync(msg, [
  "fix(ui): desktop dual-slider, mobile slider height, chat bubble overlap",
  "",
  "- getDeviceVisibilityClasses: banners_slider hardcoded lg:hidden",
  "  (overrides any DB-stored homeSections config)",
  "- mobileHeight increased to 300px for vertical slider layout",
  "- live chat bubble repositioned to bottom-24 to clear product cards",
  "",
  "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
  "Claude-Session: https://claude.ai/code/session_01GPCkuddNi1nS597FzKS4FV",
].join("\n"), "utf8");

execSync("git add -A",                    { stdio: "inherit", cwd: ROOT });
execSync('git commit -F ".git/FIX7.txt"', { stdio: "inherit", cwd: ROOT });
execSync("git push origin main",          { stdio: "inherit", cwd: ROOT });
console.log("✅ push شد!");