/**
 * AXON CORE - Pricing & Real Coupon Validation Logic Tests
 */
import { calculateOrderDiscount } from "@/lib/couponValidator";

describe("Cart & Pricing Business Logic", () => {
  test("calculates raw subtotal accurately", () => {
    const items = [
      { price: 1000000, quantity: 2 },
      { price: 500000, quantity: 1 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(2500000);
  });

  test("applies percentage discount accurately and enforces max discount limit", () => {
    const coupon = {
      code: "VIP20",
      type: "percent",
      discount_value: 20,
      max_discount_amount: 1500000,
      is_active: true,
    };

    const res = calculateOrderDiscount(coupon, 10000000);
    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(1500000);
  });

  test("rejects inactive or below min_order coupons safely", () => {
    const minOrderCoupon = {
      code: "MIN5M",
      type: "fixed",
      discount_value: 200000,
      min_order_amount: 5000000,
      is_active: true,
    };

    const res = calculateOrderDiscount(minOrderCoupon, 2000000);
    expect(res.valid).toBe(false);
    expect(res.discountAmount).toBe(0);
  });
});
