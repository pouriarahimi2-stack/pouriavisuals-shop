export interface ValidatedCouponResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
}

export function calculateOrderDiscount(coupon: any, rawTotal: number, items: any[] = []): ValidatedCouponResult {
  if (!coupon || coupon.is_active === false) {
    return { valid: false, message: "کد تخفیف نامعتبر یا غیرفعال است.", discountAmount: 0 };
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, message: "مهلت استفاده از این کد تخفیف هنوز آغاز نشده است.", discountAmount: 0 };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است.", discountAmount: 0 };
  }

  const minOrder = Number(coupon.min_order_amount ?? coupon.min_purchase ?? 0);
  if (minOrder > 0 && rawTotal < minOrder) {
    return {
      valid: false,
      message: `حداقل مبلغ سفارش برای اعمال این کوپن ${minOrder.toLocaleString("fa-IR")} تومان است.`,
      discountAmount: 0,
    };
  }

  let applicableTotal = rawTotal;
  if (coupon.target_type === "category" && coupon.target_id && items.length > 0) {
    const matchingItems = items.filter((it: any) => String(it.category) === String(coupon.target_id));
    if (matchingItems.length === 0) {
      return { valid: false, message: "این کد تخفیف مخصوص دسته‌بندی «" + coupon.target_id + "» است.", discountAmount: 0 };
    }
    applicableTotal = matchingItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  } else if (coupon.target_type === "product" && coupon.target_id && items.length > 0) {
    const matchingItems = items.filter((it: any) => String(it.productId || it.product_id || it.id) === String(coupon.target_id));
    if (matchingItems.length === 0) {
      return { valid: false, message: "این کد تخفیف فقط برای محصول خاصی معتبر است.", discountAmount: 0 };
    }
    applicableTotal = matchingItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  }

  let discount = 0;
  const cType = coupon.discount_type || coupon.type || "percent";
  const val = Number(coupon.discount_value ?? coupon.value ?? 0);

  if (cType === "percent") {
    discount = Math.round((applicableTotal * val) / 100);
    const maxDiscount = Number(coupon.max_discount_amount || coupon.max_discount || 0);
    if (maxDiscount > 0 && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = Math.min(val, applicableTotal);
  }

  discount = Math.min(discount, rawTotal);
  return { valid: true, discountAmount: discount };
}
