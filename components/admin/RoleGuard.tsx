"use client";
import { ReactNode } from "react";
export default function RoleGuard({ children, userRole, allowedRoles, fallback = null }: { children: ReactNode; userRole: string | undefined | null; allowedRoles: string[]; fallback?: ReactNode }) {
  if (!userRole || !allowedRoles.includes(userRole)) return <>{fallback}</>;
  return <>{children}</>;
}
