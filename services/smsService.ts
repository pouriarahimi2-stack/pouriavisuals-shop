export interface SendSmsResponse {
  success: boolean;
  message?: string;
  simulatedCode?: string;
  token?: string;
  verified?: boolean;
}

export const smsService = {
  async sendOtp(phone: string): Promise<SendSmsResponse> {
    try {
      const cleanPhone = String(phone)
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "send" }),
      });

      if (!res.ok) {
        throw new Error("خطا در پاسخ سرور پیامک.");
      }

      return await res.json();
    } catch (err: any) {
      console.error("smsService.sendOtp error:", err);
      return { success: false, message: err?.message || "خطا در برقراری ارتباط با سامانه پیامکی." };
    }
  },

  async verifyOtp(phone: string, code: string): Promise<SendSmsResponse> {
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

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: cleanCode, action: "verify" }),
      });

      if (!res.ok) {
        throw new Error("خطا در تایید کد پیامکی.");
      }

      return await res.json();
    } catch (err: any) {
      console.error("smsService.verifyOtp error:", err);
      return { success: false, message: err?.message || "خطا در بررسی کد تایید." };
    }
  },

  async sendTrackingCode(phone: string, nameOrOrderId: string | number, trackingCode: string): Promise<boolean> {
    try {
      const cleanPhone = String(phone)
        .trim()
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
        .replace(/\D/g, "");

      const cleanTracking = String(trackingCode).trim();

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          action: "tracking",
          customerName: String(nameOrOrderId),
          trackingCode: cleanTracking,
        }),
      });

      return res.ok;
    } catch (err) {
      console.error("smsService.sendTrackingCode error:", err);
      return false;
    }
  },

  async sendOrderStatusChange(phone: string, orderId: string, statusName: string): Promise<boolean> {
    return this.sendTrackingCode(phone, `فاکتور ${orderId}`, `تغییر وضعیت سفارش شما به: ${statusName}`);
  },

  async sendSMS(phone: string, message: string): Promise<boolean> {
    return this.sendTrackingCode(phone, "خریدار گرامی", message);
  },
};

export const sendSMS = smsService.sendSMS.bind(smsService);
export const sendOtp = smsService.sendOtp.bind(smsService);
export const verifyOtp = smsService.verifyOtp.bind(smsService);
export const sendTrackingCode = smsService.sendTrackingCode.bind(smsService);