// File Path: lib/pricingEngine.ts
// موتور متمرکز محاسبات مالی فروشگاه (AXON CORE)

export const STORE_CONFIG = {
  profitMargin: 0.10, // 10% حاشیه سود پیش‌فرض سایت
  vatRate: 0.10       // 10% مالیات بر ارزش افزوده (قانون بودجه ۱۴۰۳)
};

export const PricingEngine = {
  /**
   * محاسبه قیمت فروش (برای استفاده در پنل ادمین)
   * شما قیمت خرید را می‌دهید، سیستم قیمت نهایی نمایش در سایت (شامل سود و مالیات) را برمی‌گرداند
   */
  calculateFinalPriceFromBuyPrice: (buyPrice: number) => {
    const withProfit = buyPrice * (1 + STORE_CONFIG.profitMargin);
    const withVat = withProfit * (1 + STORE_CONFIG.vatRate);
    // رند کردن به هزار تومان بالا برای زیبایی قیمت (مثلاً ۱,۲۱۴,۰۰۰ می‌شود ۱,۲۱۵,۰۰۰)
    return Math.ceil(withVat / 1000) * 1000;
  },

  /**
   * تفکیک پیش‌فاکتور قانونی (برای استفاده در سبد خرید و Checkout)
   * قیمت نهایی را می‌گیرد و مالیات و بهای خالص را معکوس محاسبه و تفکیک می‌کند
   */
  calculateInvoiceBreakdown: (cartItems: any[]) => {
    let totalPayable = 0;
    let totalDiscount = 0;

    cartItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const originalPrice = Number(item.price) || 0;
      const discountedPrice = Number(item.discountPrice) || originalPrice;
      
      totalPayable += discountedPrice * qty;
      totalDiscount += (originalPrice - discountedPrice) * qty;
    });

    // محاسبه معکوس مالیات بر ارزش افزوده از مبلغ کل پرداخت
    // فرمول: Total = Base * 1.10  =>  Base = Total / 1.10
    const totalBeforeTax = Math.round(totalPayable / (1 + STORE_CONFIG.vatRate));
    const totalVatAmount = totalPayable - totalBeforeTax;

    return {
      totalOriginal: totalPayable + totalDiscount, // جمع کل بدون تخفیف
      totalDiscount,                               // تخفیف اعمال شده
      totalBeforeTax,                              // بهای کالاها (بدون مالیات)
      totalVatAmount,                              // ۱۰٪ مالیات بر ارزش افزوده
      finalPayable: totalPayable                   // مبلغ نهایی قابل پرداخت در درگاه
    };
  }
};
