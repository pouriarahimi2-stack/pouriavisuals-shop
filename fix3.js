const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

const checkoutPath = path.join(ROOT, "app/checkout/page.tsx");
if (fs.existsSync(checkoutPath)) {
  let content = fs.readFileSync(checkoutPath, "utf8");

  // حذف تکراری autoComplete — نگه‌داشتن فقط یکی
  content = content.replace(
    /autoComplete="one-time-code"(\s+)autoComplete="one-time-code"/g,
    'autoComplete="one-time-code"'
  );

  fs.writeFileSync(checkoutPath, content, "utf8");
  console.log("✅ duplicate autoComplete حذف شد");
}

try {
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });
  console.log("\n✅ build موفق!\n");
} catch {
  console.error("\n❌ خطا در build!\n");
  process.exit(1);
}

try {
  const ts = new Date().toISOString().slice(0,16).replace("T"," ");
  execSync("git add -A", { stdio: "inherit", cwd: ROOT });
  execSync(`git commit -m "fix: حذف duplicate autoComplete در checkout [${ts}]"`, { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("🚀 push موفق!");
} catch(e) { console.error("⚠️  git:", e.message); }