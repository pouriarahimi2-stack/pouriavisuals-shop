import { supabase } from "@/lib/supabase";

export interface Coupon {
  id: string;
  code: string;
  type?: "percent" | "fixed";
  discount_type?: "percent" | "fixed";
  value?: number;
  percent?: number;
  amount?: number;
  max_discount?: number | null;
  min_order_amount?: number | null;
  is_active: boolean;
  created_at?: string;
}

const STORAGE_KEY = "site_coupons_db";

export const couponService = {
  // ۱. دریافت همه کوپن‌ها مستقیماً از Supabase و همگام با کش محلی
  async getAll(): Promise<Coupon[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to local DB cache:", err);
    }

    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local !== null) {
        return JSON.parse(local);
      }
    }

    return [];
  },

  // ۲. استعلام کوپن بر اساس کد جهت اعمال تخفیف
  async getByCode(code: string): Promise<Coupon | null> {
    const all = await this.getAll();
    const found = all.find(
      (c) =>
        c.code.trim().toUpperCase() === code.trim().toUpperCase() &&
        c.is_active !== false
    );
    return found || null;
  },

  // ۳. ایجاد کوپن جدید در دیتابیس
  async createCoupon(coupon: Coupon): Promise<{ success: boolean; data?: Coupon }> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("coupons").insert([coupon]).select();
        if (!error && data && data.length > 0) {
          const current = await this.getAll();
          localStorage.setItem(STORAGE_KEY, JSON.stringify([data[0], ...current]));
          return { success: true, data: data[0] };
        }
      }
    } catch (err) {
      console.warn("Supabase insert error, persisting locally:", err);
    }

    // ذخیره پایدار در لوکال
    const current = await this.getAll();
    const updated = [coupon, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true, data: coupon };
  },

  // ۴. فعال / غیرفعال‌سازی کوپن در دیتابیس
  async updateStatus(id: string, is_active: boolean): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("coupons").update({ is_active }).eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase status update error:", err);
    }

    const current = await this.getAll();
    const updated = current.map((c) => (c.id === id ? { ...c, is_active } : c));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  // ۵. حذف قطعی و دائمی کوپن از دیتابیس (بدون بازگشت پس از رفرش)
  async deleteCoupon(id: string): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("coupons").delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Supabase delete error:", err);
    }

    const current = await this.getAll();
    const updated = current.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  },
};