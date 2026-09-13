// File Path: services/smsService.ts

export interface SendSmsResponse {
  success: boolean;
  message?: string;
  simulatedCode?: string;
  token?: string;
  verified?: boolean;
}

/**
 * سرویس یکپارچه پیامک کلاینت و سرور
 * تشخیص خودکار محیط اجرا جهت جلوگیری از ارور Invalid URL در توابع سرورلس
 */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const smsService = {
  async sendOtp(phone: string): Promise<SendSmsResponse> {
    try {
      const cleanPhone = String(phone)
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      const url = `${getApiBaseUrl()}/api/send-otp`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "خطا در ارسال پیامک OTP.");
      }

      return await res.json();
    } catch (err: any) {
      console.error("[smsService.sendOtp Error]:", err);
      return { success: false, message: err?.message || "خطا در ارتباط با سامانه ارسال پیامک." };
    }
  },

  async verifyOtp(phone: string, code: string, token?: string): Promise<SendSmsResponse> {
    try {
      const cleanPhone = String(phone)
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      const cleanCode = String(code)
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      const url = `${getApiBaseUrl()}/api/send-otp`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: cleanCode, token, action: "verify" }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "کد تایید پیامکی نادرست است.");
      }

      return await res.json();
    } catch (err: any) {
      console.error("[smsService.verifyOtp Error]:", err);
      return { success: false, message: err?.message || "خطا در بررسی کد تایید." };
    }
  },

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const cleanPhone = String(phone)
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      const url = `${getApiBaseUrl()}/api/sms/send`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, message }),
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      return res.ok && json.success === true;
    } catch (err) {
      console.error("[smsService.sendSMS Error]:", err);
      return false;
    }
  },

  async sendTrackingCode(phone: string, customerName: string, trackingCode: string): Promise<boolean> {
    const msg = `${customerName} گرامی، سفارش شما تحویل شرکت ملی پست گردید. کد رهگیری مرسوله پیشتاز: ${trackingCode} - پیگیری: axoncore.ir/track-order`;
    return this.sendSMS(phone, msg);
  },

  async sendOrderStatusChange(phone: string, orderId: string, statusName: string): Promise<boolean> {
    const msg = `خریدار گرامی، وضعیت سفارش #${orderId} شما در آکسون به «${statusName}» تغییر یافت. پیگیری: axoncore.ir/track-order`;
    return this.sendSMS(phone, msg);
  },

  async sendOrderPaidConfirmation(phone: string, orderId: string, amount: number): Promise<boolean> {
    const formattedAmount = Math.round(amount).toLocaleString("fa-IR");
    const msg = `سفارش #${orderId} به مبلغ ${formattedAmount} تومان با موفقیت پرداخت شد و در مرحله آماده‌سازی قرار گرفت. سپاس از خرید شما - آکسون`;
    return this.sendSMS(phone, msg);
  }
};

export const sendSMS = smsService.sendSMS.bind(smsService);
export const sendOtp = smsService.sendOtp.bind(smsService);
export const verifyOtp = smsService.verifyOtp.bind(smsService);
export const sendTrackingCode = smsService.sendTrackingCode.bind(smsService);
export const sendOrderStatusChange = smsService.sendOrderStatusChange.bind(smsService);
export default smsService;
