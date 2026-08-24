import { AdminRole, AdminUser } from "@/lib/adminContracts";
import { supabase } from "@/lib/supabase";

const LOCAL_ADMINS_KEY = "admin_users_data";
const CURRENT_SESSION_KEY = "current_admin_session";

const DEFAULT_SUPER_ADMIN: AdminUser = {
  id: "admin-root",
  username: "admin",
  name: "مدیر ارشد",
  role: "super_admin",
  created_at: new Date().toISOString(),
};

export const adminAuthService = {
  // بررسی سشن فعال
  getCurrentSession(): AdminUser | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(CURRENT_SESSION_KEY);
      if (!stored) return DEFAULT_SUPER_ADMIN;
      return JSON.parse(stored);
    } catch {
      return DEFAULT_SUPER_ADMIN;
    }
  },

  // ذخیره ورود
  setSession(user: AdminUser) {
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(user));
    }
  },

  // خروج از حساب
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  },

  // دریافت لیست همه ادمین‌ها
  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase.from("admin_users").select("*");
      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.name || u.username,
          role: (u.role as AdminRole) || "support",
          created_at: u.created_at,
        }));
      }
    } catch (e) {
      console.warn("Supabase admin fetch fallback to localStorage");
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(LOCAL_ADMINS_KEY);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }
    return [DEFAULT_SUPER_ADMIN];
  },

  // بررسی سطح دسترسی نقش به تب مشخص
  hasPermission(role: AdminRole, tab: string): boolean {
    if (role === "super_admin") return true;

    switch (tab) {
      case "products":
        return ["super_admin", "product_manager"].includes(role);
      case "inventory":
        return ["super_admin", "product_manager", "inventory_manager"].includes(role);
      case "orders":
        return ["super_admin", "support"].includes(role);
      case "articles":
        return ["super_admin", "content_editor"].includes(role);
      case "banners":
      case "pages":
      case "menus":
      case "site-settings":
        return ["super_admin", "content_editor"].includes(role);
      case "contacts":
      case "customers":
        return ["super_admin", "support"].includes(role);
      case "accounts":
        return role === "super_admin";
      default:
        return true;
    }
  },
};

export default adminAuthService;