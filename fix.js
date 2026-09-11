/**
 * AXON CORE - Phase 10: Admin Role-Based Access Control (RBAC) Guard (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-PHASE10]\x1b[0m پیاده‌سازی سیستم سطح دسترسی نقش‌محور (RBAC) برای مدیران...");

// =============================================================================
// ۱. ایجاد ماژول امنیتی lib/rbacGuard.ts
// =============================================================================
const rbacGuardCode = `/**
 * AXON CORE - Admin Role-Based Access Control (RBAC)
 */

export type AdminRole = "superadmin" | "product_manager" | "content_editor" | "inventory_manager";

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: ["*"], // دسترسی کامل به همه بخش‌ها
  product_manager: ["products.read", "products.write", "products.delete", "categories.manage"],
  content_editor: ["blogs.manage", "news.manage", "banners.manage", "pages.manage"],
  inventory_manager: ["orders.read", "orders.update", "inventory.manage", "coupons.manage"],
};

export function adminHasPermission(role: string, permission: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as AdminRole;
  if (normalizedRole === "superadmin") return true;

  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;

  return permissions.includes("*") || permissions.includes(permission);
}

export function enforceRbac(role: string, requiredPermission: string): boolean {
  return adminHasPermission(role, requiredPermission);
}
`;
writeFile('lib/rbacGuard.ts', rbacGuardCode);

// =============================================================================
// ۲. بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "security(rbac): implement admin role-based access control permission matrices"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سیستم RBAC با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}