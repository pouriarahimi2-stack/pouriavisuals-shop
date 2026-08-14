export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number; // مثلا ۱۰ درصد یا ۵۰۰۰۰ تومان
  minOrderAmount?: number;
  isActive: boolean;
}

const STORAGE_KEY = "app_coupons_db";

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "coup-1",
    code: "APPLE2026",
    type: "percent",
    value: 10,
    minOrderAmount: 1000000,
    isActive: true,
  },
  {
    id: "coup-2",
    code: "OFF500",
    type: "fixed",
    value: 500000,
    minOrderAmount: 5000000,
    isActive: true,
  },
];

export const couponService = {
  getCoupons: (): Coupon[] => {
    if (typeof window === "undefined") return DEFAULT_COUPONS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_COUPONS;
    }
  },

  addCoupon: (coupon: Omit<Coupon, "id">): Coupon[] => {
    const coupons = couponService.getCoupons();
    const newCoupon: Coupon = {
      ...coupon,
      id: `coup-${Date.now()}`,
      code: coupon.code.toUpperCase().trim(),
    };
    const updated = [newCoupon, ...coupons];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteCoupon: (id: string): Coupon[] => {
    const coupons = couponService.getCoupons();
    const updated = coupons.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  toggleCouponStatus: (id: string): Coupon[] => {
    const coupons = couponService.getCoupons();
    const updated = coupons.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  validateCoupon: (code: string, orderTotal: number): { isValid: boolean; discountAmount: number; message: string } => {
    const coupons = couponService.getCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase().trim());

    if (!coupon) {
      return { isValid: false, discountAmount: 0, message: "کد تخفیف معتبر نیست." };
    }
    if (!coupon.isActive) {
      return { isValid: false, discountAmount: 0, message: "این کد تخفیف غیرفعال شده است." };
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `حداقل مبلغ سفارش برای این کد ${coupon.minOrderAmount.toLocaleString("fa-IR")} تومان است.`,
      };
    }

    let discount = 0;
    if (coupon.type === "percent") {
      discount = (orderTotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    return { isValid: true, discountAmount: discount, message: "کد تخفیف با موفقیت اعمال شد." };
  },
};