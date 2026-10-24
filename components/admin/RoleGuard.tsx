"use client";
// File Path: components/admin/RoleGuard.tsx
// گارد امنیتی رابط کاربری (مخفی‌سازی هوشمند دکمه‌ها و منوها بر اساس سطح دسترسی)

import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  userRole: string | undefined | null;
  allowedRoles: string[];
  fallback?: ReactNode; // چیزی که در صورت عدم دسترسی نمایش داده می‌شود (مثل قفل)
}

export default function RoleGuard({ children, userRole, allowedRoles, fallback = null }: RoleGuardProps) {
  if (!userRole) return <>{fallback}</>;
  
  const hasAccess = allowedRoles.includes(userRole);
  
  if (!hasAccess) return <>{fallback}</>;
  
  return <>{children}</>;
}
