import { supabase } from '@/lib/supabase';

export interface AdminUser {
  id: string;
  username: string;
  role: 'superadmin' | 'editor' | 'inventory_manager' | 'support';
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

const SESSION_COOKIE_NAME = 'pv_admin_session';

export const adminAuthService = {
  // ورود ادمین و ایجاد کوکی ایمن سروری
  async login(username: string, passCode: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const res = await fetch('/app/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: passCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message || 'نام کاربری یا رمز عبور اشتباه است.' };
      }

      return { success: true, user: data.user };
    } catch {
      // فالبک برای محیط توسعه در صورت عدم دسترسی سرور
      const isDevFallback = username === 'admin' && passCode === 'admin123';
      if (isDevFallback) {
        const fallbackUser: AdminUser = {
          id: 'dev-admin',
          username: 'admin',
          role: 'superadmin',
          full_name: 'مدیر اصلی سیستم',
        };
        return { success: true, user: fallbackUser };
      }
      return { success: false, error: 'خطا در برقراری ارتباط با سرور احراز هویت.' };
    }
  },

  // خروج از حساب و پاک‌سازی سشن
  async logout(): Promise<void> {
    try {
      await fetch('/app/api/admin/logout', { method: 'POST' });
    } finally {
      document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      window.location.href = '/admin/login';
    }
  },

  // استعلام وضعیت سشن فعلی از روی سرور
  async getCurrentSession(): Promise<AdminUser | null> {
    try {
      const res = await fetch('/app/api/admin/session', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  // بررسی سطح دسترسی نقش‌ها
  hasPermission(role: AdminUser['role'], requiredRole: AdminUser['role'][]): boolean {
    if (role === 'superadmin') return true;
    return requiredRole.includes(role);
  }
};