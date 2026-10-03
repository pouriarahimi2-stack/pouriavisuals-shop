// File Path: lib/rbacGuard.ts
import { ROLE_PERMISSIONS, hasRouteAccess } from "@/lib/rolePermissions";

export function adminHasPermission(role: string, permission?: string): boolean {
  if (!role) return false;
  if (role === "superadmin" || role === "super_admin") return true;
  if (!permission) return true;

  const cfg = ROLE_PERMISSIONS[role];
  if (!cfg) return false;
  if (cfg.routes.includes("*")) return true;

  const normalizedPerm = permission.startsWith("/admin")
    ? permission
    : "/admin/" + permission.replace(/^\/+/, "");

  return hasRouteAccess(role, normalizedPerm);
}

export function enforceRbac(role: string, permission: string): boolean {
  return adminHasPermission(role, permission);
}
