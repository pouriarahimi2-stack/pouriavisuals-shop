// File Path: lib/pricingEngine.ts
export interface CartItem { price: number; quantity: number; discount?: number; }
export const PricingEngine = {
  calculateTotal: (items: CartItem[], globalDiscount: number = 0, shippingCost: number = 0) => {
    const subtotal = items.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const itemsDiscount = items.reduce((acc, item) => acc + ((Number(item.discount) || 0) * (Number(item.quantity) || 1)), 0);
    const totalDiscount = itemsDiscount + globalDiscount;
    return { subtotal, totalDiscount, shippingCost, finalAmount: Math.max(0, subtotal - totalDiscount) + shippingCost };
  }
};
