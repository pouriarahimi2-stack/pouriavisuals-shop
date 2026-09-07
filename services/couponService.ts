import { supabase } from "@/lib/supabase";

export interface Coupon {
  id: string | number;
  code: string;
  type: "percent" | "fixed";
  discount_type?: "percent" | "fixed";
  value: number;
  discount_value?: number;
  discountPercent?: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_discount?: number;
  maxDiscount?: number;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async create(coupon: Partial<Coupon>): Promise<Coupon | null> {
    try {
      const payload = {
        code: coupon.code?.toUpperCase().trim(),
        type: coupon.type || "percent",
        discount_type: coupon.type || "percent",
        value: Number(coupon.value || 0),
        discount_value: Number(coupon.value || 0),
        min_order_amount: coupon.min_order_amount ? Number(coupon.min_order_amount) : 0,
        max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null,
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
        usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : 100,
        used_count: 0,
        is_active: coupon.is_active !== false,
        expires_at: coupon.expires_at || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("coupons").insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Create coupon error:", e);
      return null;
    }
  },

  async update(id: string | number, updates: Partial<Coupon>): Promise<boolean> {
    try {
      const { error } = await supabase.from("coupons").update(updates).eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },

  async delete(id: string | number): Promise<boolean> {
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },

  async validateCoupon(code: string, totalAmount: number): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !coupon) {
        return { valid: false, discount: 0, message: "کد تخفیف نامعتبر یا منقضی است." };
      }

      if (coupon.min_order_amount && totalAmount < Number(coupon.min_order_amount)) {
        return { valid: false, discount: 0, message: "حداقل مبلغ سفارش برای این کد " + Number(coupon.min_order_amount).toLocaleString("fa-IR") + " تومان است." };
      }

      const isPercent = coupon.type === "percent" || coupon.discount_type === "percent";
      const val = Number(coupon.value || coupon.discount_value || 0);

      let calc = isPercent ? Math.round((totalAmount * val) / 100) : val;
      const maxLimit = Number(coupon.max_discount || coupon.max_discount_amount || 0);
      if (maxLimit > 0 && calc > maxLimit) {
        calc = maxLimit;
      }

      return { valid: true, discount: calc, message: "کد تخفیف با موفقیت اعمال گردید.", coupon };
    } catch {
      return { valid: false, discount: 0, message: "خطا در ارزیابی کد تخفیف." };
    }
  },
};
