import { supabase } from '@/lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount?: number;
  category_id?: string;
  product_id?: string;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*');

      if (error) return [];
      return (data || []).map((c: any) => ({
        id: String(c.id),
        code: c.code || '',
        discount_type: c.discount_type || 'percent',
        discount_value: Number(c.discount_value || 0),
        min_order_amount: Number(c.min_order_amount || 0),
        max_discount: c.max_discount ? Number(c.max_discount) : undefined,
        category_id: c.category_id,
        product_id: c.product_id,
        is_active: c.is_active !== false,
        expires_at: c.expires_at,
        created_at: c.created_at,
      }));
    } catch {
      return [];
    }
  },

  async validateAndApply(code: string, totalAmount: number): Promise<{ isValid: boolean; discountAmount: number; message?: string }> {
    try {
      const coupons = await this.getAll();
      const matched = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.is_active);

      if (!matched) {
        return { isValid: false, discountAmount: 0, message: 'کد تخفیف وارد شده نامعتبر است.' };
      }

      if (matched.min_order_amount && totalAmount < matched.min_order_amount) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `حداقل مبلغ سفارش برای استفاده از این کد ${matched.min_order_amount.toLocaleString('fa-IR')} تومان است.`,
        };
      }

      if (matched.expires_at && new Date(matched.expires_at) < new Date()) {
        return { isValid: false, discountAmount: 0, message: 'مهلت استفاده از این کد تخفیف به پایان رسیده است.' };
      }

      let discount = 0;
      if (matched.discount_type === 'percent') {
        discount = (totalAmount * matched.discount_value) / 100;
        if (matched.max_discount && discount > matched.max_discount) {
          discount = matched.max_discount;
        }
      } else {
        discount = matched.discount_value;
      }

      discount = Math.min(discount, totalAmount);
      return { isValid: true, discountAmount: discount };
    } catch {
      return { isValid: false, discountAmount: 0, message: 'خطا در بررسی کد تخفیف.' };
    }
  }
};