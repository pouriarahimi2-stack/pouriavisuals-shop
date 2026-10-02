// File Path: lib/rolePermissions.ts
export type AdminRole =
  | "superadmin"
  | "product_manager"
  | "order_manager"
  | "content_seo_manager"
  | "viewer_reporter"
  | "accountant"
  | "editor"
  | "support"
  | "viewer";

export interface RoleConfig {
  label: string;
  description: string;
  routes: string[];
  canRead: string[];
  color: string;
}

export const ROLE_PERMISSIONS: Record<string, RoleConfig> = {
  superadmin: {
    label: "مدیر ارشد کل سیستم",
    description: "دسترسی کامل به تمام بخش‌ها",
    routes: ["*"],
    canRead: ["*"],
    color: "text-rose-400",
  },
  product_manager: {
    label: "مدیر کاتالوگ و انبار",
    description: "مدیریت محصولات، انبار، بنرها، منوها و دیدگاه‌ها",
    routes: [
      "/admin",
      "/admin/dashboard",
      "/admin/products",
      "/admin/inventory",
      "/admin/menu",
      "/admin/banners",
      "/admin/reviews",
      "/admin/change-pin",
    ],
    canRead: ["/admin/orders"],
    color: "text-sky-400",
  },
  order_manager: {
    label: "پشتیبان سفارشات و مالی",
    description: "مدیریت سفارشات، بارنامه، مشتریان CRM، کوپن‌ها و تیکت‌ها",
    routes: [
      "/admin",
      "/admin/dashboard",
      "/admin/orders",
      "/admin/inventory",
      "/admin/financial",
      "/admin/reports",
      "/admin/customers",
      "/admin/coupons",
      "/admin/messages",
      "/admin/change-pin",
    ],
    canRead: ["/admin/products"],
    color: "text-emerald-400",
  },
  content_seo_manager: {
    label: "کارشناس محتوا و سئو",
    description: "مدیریت مقالات، رادار اخبار، سئو، هوش مصنوعی و صفحه‌ساز",
    routes: [
      "/admin",
      "/admin/dashboard",
      "/admin/blog",
      "/admin/news",
      "/admin/seo",
      "/admin/ai",
      "/admin/pages",
      "/admin/appearance",
      "/admin/styles",
      "/admin/change-pin",
    ],
    canRead: ["/admin/products"],
    color: "text-indigo-400",
  },
  viewer_reporter: {
    label: "بیننده و گزارش‌دهنده",
    description: "مشاهده داشبورد، گزارش‌های مالی و لاگ‌ها",
    routes: [
      "/admin",
      "/admin/dashboard",
      "/admin/reports",
      "/admin/financial",
      "/admin/audit-logs",
      "/admin/change-pin",
    ],
    canRead: ["/admin/products", "/admin/orders", "/admin/customers"],
    color: "text-amber-400",
  },
  accountant: {
    label: "حسابدار",
    description: "مالی، سفارشات، گزارش‌ها",
    routes: ["/admin", "/admin/dashboard", "/admin/financial", "/admin/orders", "/admin/inventory", "/admin/reports", "/admin/change-pin"],
    canRead: ["/admin/products", "/admin/customers"],
    color: "text-emerald-400",
  },
  editor: {
    label: "ویرایشگر محتوا",
    description: "وبلاگ، اخبار، سئو",
    routes: ["/admin", "/admin/dashboard", "/admin/blog", "/admin/news", "/admin/seo", "/admin/change-pin"],
    canRead: ["/admin/products"],
    color: "text-blue-400",
  },
  support: {
    label: "پشتیبان فروش",
    description: "سفارشات، پیام‌ها، مشتریان",
    routes: ["/admin", "/admin/dashboard", "/admin/orders", "/admin/messages", "/admin/reviews", "/admin/customers", "/admin/change-pin"],
    canRead: ["/admin/products"],
    color: "text-purple-400",
  },
  viewer: {
    label: "بیننده / گزارش‌گیر",
    description: "فقط مشاهده داشبورد و گزارش‌ها",
    routes: ["/admin", "/admin/dashboard", "/admin/reports", "/admin/change-pin"],
    canRead: ["/admin/products", "/admin/orders", "/admin/customers"],
    color: "text-slate-400",
  },
};

export function hasRouteAccess(role: string, pathname: string): boolean {
  if (!role || role === "superadmin") return true;
  const cfg = ROLE_PERMISSIONS[role];
  if (!cfg) return true;
  if (cfg.routes.includes("*")) return true;
  return [...cfg.routes, ...cfg.canRead].some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function hasWriteAccess(role: string, pathname: string): boolean {
  if (!role || role === "superadmin") return true;
  const cfg = ROLE_PERMISSIONS[role];
  if (!cfg) return true;
  if (cfg.routes.includes("*")) return true;
  return cfg.routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export const ALL_ROLES = Object.entries(ROLE_PERMISSIONS).map(([id, v]) => ({
  id: id as AdminRole,
  label: v.label,
  description: v.description,
  color: v.color,
}));
