export const smsService = {
  // ۱. ارسال پیامک تایید خرید و پرداخت موفق
  async sendOrderConfirmation(phone: string, orderId: string, customerName: string) {
    if (!phone) return;
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          pattern: "order_success", // نام پترن ثبت‌شده در پنل پیامک شما
          tokens: {
            token1: customerName || "مشتری گرامی",
            token2: orderId,
          },
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("Failed to send order confirmation SMS:", err);
    }
  },

  // ۲. ارسال پیامک کد رهگیری پست هنگام تغییر وضعیت سفارش به shipped
  async sendTrackingCode(phone: string, customerName: string, trackingCode: string) {
    if (!phone || !trackingCode) return;
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          pattern: "postal_tracking", // نام پترن کد مرسوله پستی
          tokens: {
            token1: customerName || "مشتری گرامی",
            token2: trackingCode,
          },
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("Failed to send tracking code SMS:", err);
    }
  },
};