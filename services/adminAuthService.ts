import { supabase } from "@/lib/supabase";

export type AdminRole = "super_admin" | "product_manager" | "content_editor";

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  full_name: string;
  role: AdminRole;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "admin_accounts_list";

export const adminAuthService = {
  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, username, full_name, role, created_at");

        if (!error && data && data.length > 0) {
          return data;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) return JSON.parse(local);

      // ادمین پیش‌فرض سیستم در صورت عدم وجود دیتابیس
      const defaultAdmins: AdminUser[] = [
        {
          id: "master-admin",
          username: "admin",
          password: "adminpassword",
          full_name: "مدیر ارشد سیستم",
          role: "super_admin",
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultAdmins));
      return defaultAdmins;
    } catch (e) {
      console.error("Error loading admin list:", e);
      return [];
    }
  },

  async login(username: string, pass: string): Promise<{ success: boolean; user?: AdminUser; message?: string }> {
    const cleanUser = username.trim();
    const cleanPass = pass.trim();

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("username", cleanUser)
          .eq("password", cleanPass)
          .single();

        if (!error && data) {
          const authenticatedUser: AdminUser = {
            id: data.id,
            username: data.username,
            full_name: data.full_name,
            role: data.role,
          };
          this.setSession(authenticatedUser);
          return { success: true, user: authenticatedUser };
        }
      }

      // بررسی لوکال در صورت آفلاین بودن
      const localList: AdminUser[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      const found = localList.find((u) => u.username === cleanUser && u.password === cleanPass);

      if (found) {
        const authenticatedUser: AdminUser = {
          id: found.id,
          username: found.username,
          full_name: found.full_name,
          role: found.role,
        };
        this.setSession(authenticatedUser);
        return { success: true, user: authenticatedUser };
      }

      return { success: false, message: "نام کاربری یا کلمه عبور وارد شده نادرست است." };
    } catch (e) {
      console.error("Login attempt error:", e);
      return { success: false, message: "خطا در ارتباط با سرور احراز هویت." };
    }
  },

  setSession(user: AdminUser) {
    if (typeof window !== "undefined") {
      localStorage.setItem("isAdminLoggedIn", "true");
      localStorage.setItem("admin_current_user", JSON.stringify(user));
      document.cookie = `admin_session=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax;`;
      document.cookie = `admin_role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax;`;
    }
  },

  async createAdmin(newAdmin: Omit<AdminUser, "id" | "created_at">): Promise<{ success: boolean; message?: string }> {
    const adminObj: AdminUser = {
      id: `admin_${Date.now()}`,
      username: newAdmin.username.trim(),
      password: newAdmin.password?.trim(),
      full_name: newAdmin.full_name?.trim() || newAdmin.username.trim(),
      role: newAdmin.role,
      created_at: new Date().toISOString(),
    };

    try {
      if (supabase) {
        const { error } = await supabase.from("admin_users").insert([adminObj]);
        if (error) {
          return { success: false, message: "این نام کاربری از قبل در سیستم ثبت شده است." };
        }
      }

      const localList: AdminUser[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      localList.push(adminObj);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));

      return { success: true };
    } catch (e) {
      console.error("Create admin error:", e);
      return { success: false, message: "خطا در ثبت کاربر ادمین جدید." };
    }
  },

  async updateCredentials(
    targetId: string,
    newUsername: string,
    newPassword?: string,
    newFullName?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const updates: any = { username: newUsername.trim() };
      if (newPassword) updates.password = newPassword.trim();
      if (newFullName) updates.full_name = newFullName.trim();

      if (supabase) {
        await supabase.from("admin_users").update(updates).eq("id", targetId);
      }

      const localList: AdminUser[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      const updatedList = localList.map((u) => (u.id === targetId ? { ...u, ...updates } : u));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

      return { success: true };
    } catch (e) {
      console.error("Update credentials error:", e);
      return { success: false, message: "خطا در به‌روزرسانی مشخصات." };
    }
  },

  async deleteAdmin(adminId: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("admin_users").delete().eq("id", adminId);
      }

      const localList: AdminUser[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      const updatedList = localList.filter((u) => u.id !== adminId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      return true;
    } catch (e) {
      console.error("Delete admin error:", e);
      return false;
    }
  },
};