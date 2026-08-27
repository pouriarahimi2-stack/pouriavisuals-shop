// File Path: services/couponService.ts
import { supabase } from "@/lib/supabase";

export interface Coupon {
  id: string | number;
  code: string;
  type?: "percent" | "fixed";
  discount_type?: "percent" | "fixed";
  value?: number;
  discount_value?: number;
  discountPercent?: number;
  min_order_amount?: number;
  minOrder?: number;
  max_discount_amount?: number;
  max_discount?: number;
  maxDiscount?: number;
  usage_limit?: number;
  used_count?: number;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "axon_coupons_cache_v2026";

export function normalizeCoupon(raw: any): Coupon {
  if (!raw) return {} as Coupon;

  const id = raw.id || `coupon_${Date.now()}`;
  const code = (raw.code || "").trim().toUpperCase();
  const type = raw.discount_type || raw.type || (raw.discountPercent ? "percent" : "fixed");
  const value = Number(raw.discount_value ?? raw.value ?? raw.discountPercent ?? 0);
  const min_order_amount = raw.min_order_amount !== undefined ? Number(raw.min_order_amount) : (raw.minOrder !== undefined ? Number(raw.minOrder) : undefined);
  const max_discount = raw.max_discount !== undefined ? Number(raw.max_discount) : (raw.max_discount_amount !== undefined ? Number(raw.max_discount_amount) : (raw.maxDiscount !== undefined ? Number(raw.maxDiscount) : undefined));
  const is_active = raw.is_active !== undefined ? Boolean(raw.is_active) : true;

  return {
    ...raw,
    id,
    code,
    type,
    discount_type: type,
    value,
    discount_value: value,
    discountPercent: type === "percent" ? value : undefined,
    min_order_amount,
    minOrder: min_order_amount,
    max_discount,
    max_discount_amount: max_discount,
    maxDiscount: max_discount,
    usage_limit: raw.usage_limit !== undefined ? Number(raw.usage_limit) : undefined,
    used_count: Number(raw.used_count ?? 0),
    expires_at: raw.expires_at || undefined,
    is_active,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const mapped = data.map(normalizeCoupon);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      }

      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          return JSON.parse(cached).map(normalizeCoupon);
        }
      }

      return [];
    } catch (err) {
      console.error("couponService getAll error:", err);
      return [];
    }
  },

  async validateCoupon(
    code: string,
    totalAmount: number
  ): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
    try {
      const cleanCode = code.trim().toUpperCase();

      if (supabase) {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", cleanCode)
          .eq("is_active", true)
          .maybeSingle();

        if (!error && data) {
          const matched = normalizeCoupon(data);

          if (matched.expires_at && new Date(matched.expires_at) < new Date()) {
            return { valid: false, discount: 0, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." };
          }

          if (matched.min_order_amount && totalAmount < matched.min_order_amount) {
            return {
              valid: false,
              discount: 0,
              message: `حداقل مبلغ سفارش برای اعمال این کد ${matched.min_order_amount.toLocaleString("fa-IR")} تومان است.`,
            };
          }

          if (matched.usage_limit && (matched.used_count ?? 0) >= matched.usage_limit) {
            return { valid: false, discount: 0, message: "ظرفیت استفاده از این کد تخفیف تکمیل شده است." };
          }

          let calculatedDiscount = 0;
          const type = matched.discount_type || matched.type;
          const val = Number(matched.discount_value ?? matched.value ?? 0);

          if (type === "percent") {
            calculatedDiscount = (totalAmount * val) / 100;
            const maxLimit = matched.max_discount ?? matched.max_discount_amount ?? matched.maxDiscount;
            if (maxLimit && calculatedDiscount > maxLimit) {
              calculatedDiscount = maxLimit;
            }
          } else {
            calculatedDiscount = val;
          }

          calculatedDiscount = Math.min(calculatedDiscount, totalAmount);

          return {
            valid: true,
            discount: calculatedDiscount,
            message: "کد تخفیف با موفقیت اعمال گردید.",
            coupon: matched,
          };
        }
      }

      return { valid: false, discount: 0, message: "کد تخفیف وارد شده معتبر نیست یا غیرفعال شده است." };
    } catch (err) {
      console.error("couponService validateCoupon error:", err);
      return { valid: false, discount: 0, message: "خطا در پردازش کد تخفیف." };
    }
  },

  async create(couponData: Partial<Coupon>): Promise<Coupon | null> {
    try {
      const normalized = normalizeCoupon({
        ...couponData,
        id: `cp_${Date.now()}`,
      });

      if (supabase) {
        const payload = {
          code: normalized.code,
          type: normalized.type,
          discount_type: normalized.discount_type,
          value: normalized.value,
          discount_value: normalized.discount_value,
          min_order_amount: normalized.min_order_amount || null,
          max_discount: normalized.max_discount || null,
          usage_limit: normalized.usage_limit || null,
          used_count: 0,
          expires_at: normalized.expires_at || null,
          is_active: normalized.is_active,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("coupons")
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          const current = await this.getAll();
          const updatedList = [normalizeCoupon(data), ...current.filter((c) => String(c.id) !== String(data.id))];
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
            window.dispatchEvent(new CustomEvent("coupons_updated", { detail: updatedList }));
          }
          return normalizeCoupon(data);
        }
      }

      return null;
    } catch (err) {
      console.error("couponService create error:", err);
      return null;
    }
  },

  async update(id: string | number, couponData: Partial<Coupon>): Promise<boolean> {
    try {
      if (supabase) {
        const payload: any = {
          ...couponData,
          updated_at: new Date().toISOString(),
        };
        await supabase.from("coupons").update(payload).eq("id", id);
      }

      const current = await this.getAll();
      const updatedList = current.map((c) =>
        String(c.id) === String(id) ? normalizeCoupon({ ...c, ...couponData }) : c
      );

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent("coupons_updated", { detail: updatedList }));
      }
      return true;
    } catch (err) {
      console.error("couponService update error:", err);
      return false;
    }
  },

  async delete(id: string | number): Promise<boolean> {
    try {
      if (supabase) {
        await supabase.from("coupons").delete().eq("id", id);
      }

      const current = await this.getAll();
      const updatedList = current.filter((c) => String(c.id) !== String(id));

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent("coupons_updated", { detail: updatedList }));
      }
      return true;
    } catch (err) {
      console.error("couponService delete error:", err);
      return false;
    }
  },
};