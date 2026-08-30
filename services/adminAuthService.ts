// File Path: services/adminAuthService.ts
export type AdminRole = "superadmin" | "super_admin" | "product_manager" | "content_editor" | "inventory_manager";

export interface AdminUser {
  id: string;
  username: string;
  full_name?: string;
  role: AdminRole;
  created_at?: string;
}

export const adminAuthService = {
  async getCurrentSession(): Promise<AdminUser | null> {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (typeof window !== "undefined") {
            localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(data.user));
          }
          return data.user;
        }
      }

      if (typeof window !== "undefined") {
        const local = localStorage.getItem("axon_admin_active_session_v2026");
        if (local) return JSON.parse(local);
      }
      return null;
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("axon_admin_active_session_v2026");
        if (local) return JSON.parse(local);
      }
      return null;
    }
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: AdminUser; message?: string }> {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined" && data.user) {
          localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(data.user));
        }
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || "نام کاربری یا رمز عبور اشتباه است." };
    } catch {
      return { success: false, message: "خطا در برقراری ارتباط با سرور." };
    }
  },

  async logout(): Promise<boolean> {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("axon_admin_active_session_v2026");
      }
      return true;
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("axon_admin_active_session_v2026");
      }
      return true;
    }
  },

  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
      return [];
    } catch {
      return [];
    }
  },

  async createAdmin(userData: {
    username: string;
    password: string;
    full_name?: string;
    role?: AdminRole;
  }): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const json = await res.json();
      return json;
    } catch {
      return { success: false, message: "خطا در ارتباط با سرور." };
    }
  },

  async updateCredentials(
    id: string,
    username?: string,
    password?: string,
    full_name?: string,
    role?: AdminRole
  ): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, username, password, full_name, role }),
      });

      const json = await res.json();
      return json;
    } catch {
      return { success: false, message: "خطا در ثبت تغییرات در سرور." };
    }
  },

  async deleteAdmin(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

export default adminAuthService;