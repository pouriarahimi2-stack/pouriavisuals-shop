const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

const checkoutPath = path.join(ROOT, "app/checkout/page.tsx");
let content = fs.readFileSync(checkoutPath, "utf8");

// پیدا کردن و حذف تمام autoComplete تکراری
// هر جایی که دو autoComplete="one-time-code" پشت سر هم باشن (با هر فاصله‌ای)
const before = (content.match(/autoComplete="one-time-code"/g) || []).length;

// روش ۱: regex چندخطی
content = content.replace(
  /autoComplete="one-time-code"([\s\S]*?)autoComplete="one-time-code"/,
  'autoComplete="one-time-code"$1'
);

// روش ۲: مطمئن شویم فقط یکی مانده
while ((content.match(/autoComplete="one-time-code"/g) || []).length > 1) {
  content = content.replace(
    /autoComplete="one-time-code"([\s\n\r\t ]*?)autoComplete="one-time-code"/,
    'autoComplete="one-time-code"'
  );
}

const after = (content.match(/autoComplete="one-time-code"/g) || []).length;
console.log("قبل: " + before + " — بعد: " + after);

fs.writeFileSync(checkoutPath, content, "utf8");
console.log("✅ checkout/page.tsx ذخیره شد");

// نمایش خطوط ۳۷۵-۳۹۰ برای تأیید
const lines = content.split("\n");
console.log("\n--- خطوط ۳۷۵ تا ۳۹۰ ---");
lines.slice(374, 390).forEach((l, i) => console.log((375 + i) + ": " + l));

try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ build موفق!\n");
} catch {
  console.error("\n❌ هنوز خطا داره\n");
  process.exit(1);
}

try {
  const ts = new Date().toISOString().slice(0,16).replace("T"," ");
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync(`git commit -m "fix: حذف autoComplete تکراری checkout [${ts}]"`, { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("🚀 push موفق!");
} catch(e) { console.error("⚠️  git:", e.message); }