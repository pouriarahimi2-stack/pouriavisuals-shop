// File Path: services/adminAuthService.ts
import { supabase } from "@/lib/supabase";

export type AdminRole = "superadmin" | "super_admin" | "product_manager" | "inventory_manager" | "content_editor";

export interface AdminUser {
  id: string;
  username: string;
  full_name?: string;
  role: AdminRole;
}

const STORAGE_KEY = "axon_admin_active_session_v2026";

export const adminAuthService = {
  async getCurrentSession(): Promise<AdminUser | null> {
    try {
      if (typeof window !== "undefined") {
        try {
          const res = await fetch("/api/admin/session", { method: "GET", cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
              return data.user;
            }
          }
        } catch {}

        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            return JSON.parse(local);
          } catch {
            return null;
          }
        }
      }
      return null;
    } catch (e) {
      console.error("getCurrentSession error:", e);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  },

  async logout(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        await fetch("/api/admin/logout", { method: "POST" });
      }
    } catch (e) {
      console.error("logout error:", e);
    }
  },

  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("admin_users").select("id, username, full_name, role");
        if (!error && data && data.length > 0) return data;
      }
      return [
        { id: "1", username: "admin", full_name: "مدیر ارشد سیستم", role: "superadmin" },
      ];
    } catch {
      return [];
    }
  },

  async updateCredentials(id: string, username: string, password?: string, full_name?: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (supabase) {
        const payload: any = { username, full_name };
        if (password) payload.password = password;
        await supabase.from("admin_users").update(payload).eq("id", id);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در تغییر مشخصات." };
    }
  },

  async createAdmin(userData: { username: string; password: string; full_name: string; role: AdminRole }): Promise<{ success: boolean; message?: string }> {
    try {
      if (supabase) {
        const { error } = await supabase.from("admin_users").insert([{
          id: `adm_${Date.now()}`,
          ...userData,
          created_at: new Date().toISOString(),
        }]);
        if (error) return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در ایجاد ادمین." };
    }
  },

  async deleteAdmin(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("admin_users").delete().eq("id", id);
      }
      return true;
    } catch {
      return false;
    }
  },
};

export default adminAuthService;