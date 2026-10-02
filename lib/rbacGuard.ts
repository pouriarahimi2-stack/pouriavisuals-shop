// File Path: lib/rbacGuard.ts
export function adminHasPermission(role: string, _permission?: string): boolean {
  if (!role) return false;
  return true;
}

export function enforceRbac(role: string, permission: string): boolean {
  return adminHasPermission(role, permission);
}
