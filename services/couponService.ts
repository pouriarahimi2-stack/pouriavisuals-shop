import { supabase } from '@/lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  expires_at?: string;
  is_active: boolean;
  usage_limit?: number;
  used_count?: number;
  created_at?: string;
}

export const couponService = {
  async getCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Coupon[];
    } catch {
      return [];
    }
  },

  async getAll(): Promise<Coupon[]> {
    return this.getCoupons();
  },

  async saveCoupon(coupon: Partial<Coupon>): Promise<{ success: boolean; data?: Coupon }> {
    try {
      if (coupon.id && !coupon.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('coupons')
          .update(coupon)
          .eq('id', coupon.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await supabase
          .from('coupons')
          .insert(coupon)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch {
      return { success: false };
    }
  },

  async create(coupon: Partial<Coupon>) {
    return this.saveCoupon(coupon);
  },

  async update(id: string, coupon: Partial<Coupon>) {
    return this.saveCoupon({ ...coupon, id });
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
};

export default couponService;