const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.join(__dirname);

const rolesPath = path.join(ROOT, "app/api/admin/roles/route.ts");
if (fs.existsSync(rolesPath)) {
  let content = fs.readFileSync(rolesPath, "utf8");

  // رفع همه موارد ROLE_PERMISSIONS[role] با cast صحیح
  content = content.replace(
    /ROLE_PERMISSIONS\[role\]/g,
    "ROLE_PERMISSIONS[role as import('@/lib/rolePermissions').AdminRole]"
  );

  fs.writeFileSync(rolesPath, content, "utf8");
  console.log("✅ تمام موارد ROLE_PERMISSIONS[role] پچ شدند");
}

console.log("\n🏗️  build...\n");
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
  execSync(`git commit -m "fix(ts): رفع کامل TypeScript error در roles [${ts}]"`, { stdio: "inherit", cwd: ROOT });
  execSync("git push origin main", { stdio: "inherit", cwd: ROOT });
  console.log("🚀 push موفق!");
} catch(e) { console.error("⚠️  git:", e.message); }