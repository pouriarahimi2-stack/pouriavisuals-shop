/**
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
