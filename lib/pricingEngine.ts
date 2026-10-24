// File Path: lib/pricingEngine.ts
// موتور متمرکز محاسبات مالی (تضمین اصل DRY در کل فروشگاه)

export interface CartItem {
  price: number;
  quantity: number;
  discount?: number;
}

export const PricingEngine = {
  calculateTotal: (items: CartItem[], globalDiscount: number = 0, shippingCost: number = 0) => {
    // محاسبه جمع کل بدون تخفیف
    const subtotal = items.reduce((acc, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.quantity) || 1;
      return acc + (itemPrice * itemQty);
    }, 0);

    // محاسبه تخفیف‌های خطی (روی هر کالا)
    const itemsDiscount = items.reduce((acc, item) => {
      const discount = Number(item.discount) || 0;
      const itemQty = Number(item.quantity) || 1;
      return acc + (discount * itemQty);
    }, 0);

    const totalDiscount = itemsDiscount + globalDiscount;
    const finalAmount = Math.max(0, subtotal - totalDiscount) + shippingCost;

    return {
      subtotal,
      totalDiscount,
      shippingCost,
      finalAmount
    };
  },
  
  calculateProfit: (sellingPrice: number, purchasePrice: number) => {
    return Math.max(0, sellingPrice - purchasePrice);
  }
};
