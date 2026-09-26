export type AdminRole = "superadmin"|"accountant"|"editor"|"support"|"viewer";
export interface RoleConfig { label: string; description: string; routes: string[]; canRead: string[]; color: string; }

export const ROLE_PERMISSIONS: Record<AdminRole, RoleConfig> = {
  superadmin: { label:"مدیر ارشد",         description:"دسترسی کامل",                          routes:["*"], canRead:[], color:"text-rose-400" },
  accountant: { label:"حسابدار",            description:"مالی، سفارشات، گزارش‌ها",              routes:["/admin/dashboard","/admin/financial","/admin/orders"], canRead:["/admin/products","/admin/customers"], color:"text-emerald-400" },
  editor:     { label:"ویرایشگر محتوا",     description:"وبلاگ، اخبار، سئو",                   routes:["/admin/dashboard","/admin/blog","/admin/news","/admin/seo"], canRead:["/admin/products"], color:"text-blue-400" },
  support:    { label:"پشتیبان فروش",       description:"سفارشات، پیام‌ها، مشتریان",           routes:["/admin/dashboard","/admin/orders","/admin/messages","/admin/reviews","/admin/customers"], canRead:["/admin/products"], color:"text-purple-400" },
  viewer:     { label:"بیننده / گزارش‌گیر", description:"فقط مشاهده داشبورد",                 routes:["/admin/dashboard"], canRead:["/admin/products","/admin/orders","/admin/customers"], color:"text-slate-400" },
};

export function hasRouteAccess(role: string, pathname: string): boolean {
  const cfg = ROLE_PERMISSIONS[role as AdminRole];
  if (!cfg) return false;
  if (cfg.routes.includes("*")) return true;
  return [...cfg.routes, ...cfg.canRead].some(r => pathname.startsWith(r));
}
export function hasWriteAccess(role: string, pathname: string): boolean {
  const cfg = ROLE_PERMISSIONS[role as AdminRole];
  if (!cfg) return false;
  if (cfg.routes.includes("*")) return true;
  return cfg.routes.some(r => pathname.startsWith(r));
}
export const ALL_ROLES = Object.entries(ROLE_PERMISSIONS).map(([id, v]) => ({ id: id as AdminRole, label: v.label, description: v.description, color: v.color }));
