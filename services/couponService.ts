import { supabase } from "@/lib/supabase";

export interface Coupon {
  id: string | number;
  code: string;
  type: "percent" | "fixed";
  discount_type?: "percent" | "fixed";
  value: number;
  discount_value?: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count?: number;
  target_type?: "all" | "category" | "product";
  target_id?: string | null;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at?: string;
}

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      const res = await fetch("/api/coupons", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  async create(coupon: Partial<Coupon>): Promise<Coupon | null> {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coupon),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  async update(id: string | number, updates: Partial<Coupon>): Promise<boolean> {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, id }),
      });
      const json = await res.json();
      return !!json.success;
    } catch {
      return false;
    }
  },

  async delete(id: string | number): Promise<boolean> {
    try {
      const res = await fetch("/api/coupons?id=" + encodeURIComponent(id), { method: "DELETE" });
      const json = await res.json();
      return !!json.success;
    } catch {
      return false;
    }
  },

  async validateCoupon(code: string, totalAmount: number, items: any[] = []): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !coupon) {
        return { valid: false, discount: 0, message: "کد تخفیف نامعتبر یا غیرفعال است." };
      }

      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return { valid: false, discount: 0, message: "زمان استفاده از این کد تخفیف هنوز شروع نشده است." };
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return { valid: false, discount: 0, message: "مهلت اعتبار این کد تخفیف به پایان رسیده است." };
      }

      if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
        return { valid: false, discount: 0, message: "ظرفیت استفاده از این کد تخفیف به پایان رسیده است." };
      }

      if (coupon.min_order_amount && totalAmount < Number(coupon.min_order_amount)) {
        return { valid: false, discount: 0, message: "حداقل مبلغ سفارش برای این کد " + Number(coupon.min_order_amount).toLocaleString("fa-IR") + " تومان است." };
      }

      // ارزیابی هدف‌گذاری کالا یا دسته
      let applicableAmount = totalAmount;
      if (coupon.target_type === "category" && coupon.target_id && items.length > 0) {
        const matchingItems = items.filter((it: any) => it.category === coupon.target_id);
        if (matchingItems.length === 0) {
          return { valid: false, discount: 0, message: "این کد تخفیف مخصوص دسته‌بندی «" + coupon.target_id + "» است." };
        }
        applicableAmount = matchingItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      } else if (coupon.target_type === "product" && coupon.target_id && items.length > 0) {
        const matchingItems = items.filter((it: any) => String(it.productId || it.product_id) === String(coupon.target_id));
        if (matchingItems.length === 0) {
          return { valid: false, discount: 0, message: "این کد تخفیف فقط برای محصول خاصی معتبر است." };
        }
        applicableAmount = matchingItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      }

      const isPercent = coupon.type === "percent" || coupon.discount_type === "percent";
      const val = Number(coupon.value || coupon.discount_value || 0);

      let calc = isPercent ? Math.round((applicableAmount * val) / 100) : val;
      const maxLimit = Number(coupon.max_discount || coupon.max_discount_amount || 0);
      if (maxLimit > 0 && calc > maxLimit) {
        calc = maxLimit;
      }

      return { valid: true, discount: calc, message: "کد تخفیف با موفقیت اعمال گردید.", coupon };
    } catch {
      return { valid: false, discount: 0, message: "خطا در بررسی اعتبار کد تخفیف." };
    }
  },
};
