import { supabase } from "@/lib/supabase";

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = "site_coupons";

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) return JSON.parse(local);

      // کوپن‌های اولیه پیش‌فرض
      const defaults: Coupon[] = [
        {
          id: "coup_welcome",
          code: "WELCOME10",
          type: "percent",
          value: 10,
          min_order_amount: 100000,
          max_discount_amount: 500000,
          usage_limit: 100,
          used_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
      return defaults;
    } catch (e) {
      console.error("Error loading coupons:", e);
      return [];
    }
  },

  async create(coupon: Omit<Coupon, "id" | "used_count" | "created_at">): Promise<Coupon | null> {
    const newCoupon: Coupon = {
      id: `coup_${Date.now()}`,
      used_count: 0,
      created_at: new Date().toISOString(),
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
    };

    try {
      const all = await this.getAll();
      const updated = [newCoupon, ...all];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      if (supabase) {
        await supabase.from("coupons").insert([newCoupon]);
      }

      this.broadcast(updated);
      return newCoupon;
    } catch (e) {
      console.error("Error creating coupon:", e);
      return null;
    }
  },

  async update(id: string, updates: Partial<Coupon>): Promise<boolean> {
    try {
      const all = await this.getAll();
      const updated = all.map((c) => (c.id === id ? { ...c, ...updates } : c));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      if (supabase) {
        await supabase.from("coupons").update(updates).eq("id", id);
      }

      this.broadcast(updated);
      return true;
    } catch (e) {
      console.error("Error updating coupon:", e);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const all = await this.getAll();
      const updated = all.filter((c) => c.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      if (supabase) {
        await supabase.from("coupons").delete().eq("id", id);
      }

      this.broadcast(updated);
      return true;
    } catch (e) {
      console.error("Error deleting coupon:", e);
      return false;
    }
  },

  async validate(code: string, currentTotal: number): Promise<Coupon | null> {
    const all = await this.getAll();
    const cleanCode = code.toUpperCase().trim();
    const found = all.find((c) => c.code === cleanCode && c.is_active !== false);

    if (!found) return null;

    // بررسی تاریخ انقضا
    if (found.expires_at && new Date(found.expires_at) < new Date()) {
      return null;
    }

    // بررسی سقف تعداد استفاده
    if (found.usage_limit && (found.used_count || 0) >= found.usage_limit) {
      return null;
    }

    // بررسی حداقل مبلغ سفارش
    if (found.min_order_amount && currentTotal < found.min_order_amount) {
      return null;
    }

    return found;
  },

  broadcast(coupons: Coupon[]) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coupons_updated", { detail: coupons }));
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("coupons_sync_channel");
        channel.postMessage({ type: "SYNC_COUPONS", data: coupons });
        channel.close();
      }
    }
  },
};