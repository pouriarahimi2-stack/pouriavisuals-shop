// File Path: lib/roleWriteFirewall.ts

// ماژول‌هایی که هر نقش (به جز مدیر ارشد که به همه چیز دسترسی کامل دارد) مجاز به ویرایش و انجام کار در آن‌هاست.
// هر ماژول دیگری که توسط مدیر ارشد برای این نقش‌ها تیک بخورد، صرفاً در حالت «فقط مشاهده (Read-Only)» باز می‌شود.
export const ROLE_WRITABLE_MODULES_MAP: Record<string, string[]> = {
  superadmin: ["all"],
  product_manager: ["products", "inventory", "menu", "banners", "reviews", "messages"],
  order_manager: ["orders", "customers", "financial", "coupons", "messages"],
  content_seo_manager: ["blog", "news", "seo", "ai", "pages", "messages"],
  viewer_reporter: [], // بیننده و گزارش‌دهنده در تمام بخش‌ها ۱۰۰٪ فقط خواندنی است
};

export function canRoleWriteModule(role: string | undefined, moduleId: string): boolean {
  const cleanRole = String(role || "").toLowerCase();
  if (cleanRole === "superadmin") return true;
  if (cleanRole === "viewer_reporter") return false;
  const writableList = ROLE_WRITABLE_MODULES_MAP[cleanRole] || [];
  return writableList.includes("all") || writableList.includes(moduleId);
}

const ADMIN_PAGE_TO_MODULE: Array<{ prefix: string; moduleId: string }> = [
  { prefix: "/admin/products", moduleId: "products" },
  { prefix: "/admin/inventory", moduleId: "inventory" },
  { prefix: "/admin/orders", moduleId: "orders" },
  { prefix: "/admin/financial", moduleId: "financial" },
  { prefix: "/admin/reports", moduleId: "reports" },
  { prefix: "/admin/banners", moduleId: "banners" },
  { prefix: "/admin/customers", moduleId: "customers" },
  { prefix: "/admin/coupons", moduleId: "coupons" },
  { prefix: "/admin/appearance", moduleId: "appearance" },
  { prefix: "/admin/menu", moduleId: "menu" },
  { prefix: "/admin/pages", moduleId: "pages" },
  { prefix: "/admin/styles", moduleId: "styles" },
  { prefix: "/admin/seo", moduleId: "seo" },
  { prefix: "/admin/blog", moduleId: "blog" },
  { prefix: "/admin/news", moduleId: "news" },
  { prefix: "/admin/ai", moduleId: "ai" },
  { prefix: "/admin/messages", moduleId: "messages" },
  { prefix: "/admin/reviews", moduleId: "reviews" },
  { prefix: "/admin/roles", moduleId: "roles" },
  { prefix: "/admin/change-pin", moduleId: "change_pin" },
  { prefix: "/admin/audit-logs", moduleId: "audit_logs" },
  { prefix: "/admin/backup", moduleId: "backup" },
  { prefix: "/admin/settings", moduleId: "settings" },
  { prefix: "/admin/torob", moduleId: "torob" },
  { prefix: "/admin/dashboard", moduleId: "dashboard" },
];

export function canRoleWriteOnAdminPage(role: string | undefined, pathname: string): boolean {
  const cleanRole = String(role || "").toLowerCase();
  if (cleanRole === "superadmin") return true;
  if (cleanRole === "viewer_reporter") return false;

  const matched = ADMIN_PAGE_TO_MODULE.find((m) => pathname.startsWith(m.prefix));
  if (!matched) return false;

  // در صفحه یکپارچه /admin/inventory، هم مدیر انبار و هم پشتیبان سفارشات در تب مربوط به خودشان مجاز به کار هستند
  if (matched.prefix === "/admin/inventory") {
    return cleanRole === "product_manager" || cleanRole === "order_manager";
  }
  // در صفحه /admin/appearance، اگر مدیر منو یا صفحه‌ساز باشد
  if (matched.prefix === "/admin/appearance") {
    return cleanRole === "content_seo_manager" || cleanRole === "product_manager";
  }

  return canRoleWriteModule(cleanRole, matched.moduleId);
}

// بررسی دقیق مجوز نوشتن/ویرایش/حذف در سطح APIهای بک‌اند برای هر نقش
export function canRoleMutateApi(role: string | undefined, apiPathname: string): boolean {
  const cleanRole = String(role || "").toLowerCase();
  if (cleanRole === "superadmin") return true;
  if (cleanRole === "viewer_reporter") return false;

  // خروج از حساب برای همه مجاز است
  if (apiPathname.startsWith("/api/admin/logout")) return true;
  // تمام نقش‌های مدیریتی به‌جز بیننده (viewer_reporter) مجاز به پاسخگویی در گفتگوی زنده هستند
  if (apiPathname.startsWith("/api/live-chat") || apiPathname.startsWith("/api/admin/messages")) {
    return cleanRole !== "viewer_reporter";
  }

  // بخش‌های حیاتی مالک سایت که هیچ نقشی به جز superadmin حق تغییر آن‌ها را ندارد
  const ownerOnlyApis = [
    "/api/admin/settings",
    "/api/admin/backup",
    "/api/admin/users",
    "/api/admin/roles",
    "/api/admin/change-pin",
    "/api/admin/audit-logs",
    "/api/styles",
    "/api/admin/styles",
    "/api/theme-builder",
  ];
  if (ownerOnlyApis.some((p) => apiPathname.startsWith(p))) {
    return false;
  }

  if (cleanRole === "product_manager") {
    const allowed = [
      "/api/products",
      "/api/admin/products",
      "/api/admin/import-products",
      "/api/admin/export-products",
      "/api/accounting",
      "/api/admin/financial",
      "/api/categories",
      "/api/admin/banners",
      "/api/admin/reviews",
      "/api/reviews",
      "/api/admin/upload",
      "/api/site-info", // برای ذخیره درخت منو و دسته‌بندی‌ها
    ];
    return allowed.some((p) => apiPathname.startsWith(p));
  }

  if (cleanRole === "order_manager") {
    const allowed = [
      "/api/admin/orders",
      "/api/orders",
      "/api/crm",
      "/api/admin/coupons",
      "/api/coupons",
      "/api/admin/messages",
      "/api/contact",
      "/api/admin/sms",
      "/api/admin/send-discount-sms",
      "/api/sms/send",
    ];
    return allowed.some((p) => apiPathname.startsWith(p));
  }

  if (cleanRole === "content_seo_manager") {
    const allowed = [
      "/api/blogs",
      "/api/news",
      "/api/admin/news",
      "/api/admin/seo-audit",
      "/api/ai-seo-autopilot",
      "/api/ai-assistant",
      "/api/pages",
      "/api/admin/upload",
    ];
    return allowed.some((p) => apiPathname.startsWith(p));
  }

  return false;
}
