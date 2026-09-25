/**
 * lib/rolePermissions.ts
 * ماتریس دسترسی‌های مدیران سایت
 * هر role فقط به route های مشخصی دسترسی دارد
 */

export type AdminRole =
  | "superadmin"
  | "accountant"
  | "editor"
  | "support"
  | "viewer";

export interface RoleConfig {
  label:       string;
  description: string;
  routes:      string[];   // "*" یعنی همه چیز
  canRead:     string[];   // route هایی که فقط read دارد
  color:       string;
}

export const ROLE_PERMISSIONS: Record<AdminRole, RoleConfig> = {
  superadmin: {
    label:       "مدیر ارشد",
    description: "دسترسی کامل به تمام بخش‌های سیستم",
    routes:      ["*"],
    canRead:     [],
    color:       "text-rose-400",
  },
  accountant: {
    label:       "حسابدار",
    description: "مرکز مالی، سفارشات، گزارش‌ها و فاکتورها",
    routes:      [
      "/admin/dashboard",
      "/admin/financial",
      "/admin/orders",
    ],
    canRead:     ["/admin/products", "/admin/customers"],
    color:       "text-emerald-400",
  },
  editor: {
    label:       "ویرایشگر محتوا و سئو",
    description: "وبلاگ، مقالات، اخبار و بهینه‌سازی موتور جستجو",
    routes:      [
      "/admin/dashboard",
      "/admin/blog",
      "/admin/news",
      "/admin/seo",
    ],
    canRead:     ["/admin/products"],
    color:       "text-blue-400",
  },
  support: {
    label:       "پشتیبان فروش",
    description: "سفارشات، پیام‌ها، تیکت‌ها و دیدگاه‌ها",
    routes:      [
      "/admin/dashboard",
      "/admin/financial",
      "/admin/messages",
      "/admin/reviews",
      "/admin/customers",
    ],
    canRead:     ["/admin/products"],
    color:       "text-purple-400",
  },
  viewer: {
    label:       "بیننده / گزارش‌گیر",
    description: "فقط مشاهده داشبورد و آمار — بدون تغییر",
    routes:      ["/admin/dashboard"],
    canRead:     [
      "/admin/products",
      "/admin/financial",
      "/admin/customers",
    ],
    color:       "text-slate-400",
  },
};

/**
 * بررسی اینکه آیا role مورد نظر به route دسترسی دارد
 */
export function hasRouteAccess(role: string, pathname: string): boolean {
  const cfg = ROLE_PERMISSIONS[role as AdminRole];
  if (!cfg) return false;
  if (cfg.routes.includes("*")) return true;
  return cfg.routes.some(r => pathname.startsWith(r)) ||
         cfg.canRead.some(r => pathname.startsWith(r));
}

/**
 * بررسی دسترسی write (نوشتن/ویرایش)
 */
export function hasWriteAccess(role: string, pathname: string): boolean {
  const cfg = ROLE_PERMISSIONS[role as AdminRole];
  if (!cfg) return false;
  if (cfg.routes.includes("*")) return true;
  return cfg.routes.some(r => pathname.startsWith(r));
}

export const ALL_ROLES = Object.entries(ROLE_PERMISSIONS).map(([key, val]) => ({
  id:          key as AdminRole,
  label:       val.label,
  description: val.description,
  color:       val.color,
}));
