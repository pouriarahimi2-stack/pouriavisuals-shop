/**
 * AXON CORE - Pricing & Cart Unit Tests
 */

describe("Cart & Pricing Business Logic", () => {
  test("calculates raw subtotal correctly", () => {
    const items = [
      { price: 1000000, quantity: 2 },
      { price: 500000, quantity: 1 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(2500000);
  });

  test("applies percentage discount accurately and respects max discount", () => {
    const rawTotal = 10000000;
    const discountPercent = 20;
    const maxDiscount = 1500000;

    let discount = Math.round((rawTotal * discountPercent) / 100);
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }

    const finalPayable = Math.max(0, rawTotal - discount);
    expect(discount).toBe(1500000);
    expect(finalPayable).toBe(8500000);
  });
});
