/**
 * services/smsService.ts
 * سرویس پیامک — wrapper روی otpService
 */

function getBase(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000");
}

function clean(phone: string): string {
  return String(phone || "").trim()
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
}

export const smsService = {
  async sendOtp(phone: string) {
    try {
      const res  = await fetch(getBase() + "/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean(phone), action: "send" }),
        cache: "no-store",
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || "خطای ارتباط" };
    }
  },

  async verifyOtp(phone: string, code: string, token?: string) {
    try {
      const res  = await fetch(getBase() + "/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean(phone), code: clean(code), token, action: "verify" }),
        cache: "no-store",
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e?.message || "خطای ارتباط" };
    }
  },

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const res  = await fetch(getBase() + "/api/sms/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean(phone), message }),
        cache: "no-store",
      });
      const d = await res.json().catch(() => ({}));
      return res.ok && d.success === true;
    } catch { return false; }
  },

  async sendOrderPaidConfirmation(phone: string, orderId: string, amount: number): Promise<boolean> {
    const fa  = Number(amount || 0).toLocaleString("fa-IR");
    return this.sendSMS(phone, `پرداخت موفق! سفارش ${orderId.slice(0,8).toUpperCase()} به مبلغ ${fa} تومان. کد رهگیری: axoncore.ir/track-order`);
  },

  async sendOrderStatusChange(phone: string, orderId: string, statusName: string): Promise<boolean> {
    return this.sendSMS(phone, `وضعیت سفارش ${orderId.slice(0,8).toUpperCase()} شما به «${statusName}» تغییر یافت — axoncore.ir/track-order`);
  },

  async sendTrackingCode(phone: string, name: string, code: string): Promise<boolean> {
    return this.sendSMS(phone, `${name} عزیز، مرسوله شما ارسال شد. کد رهگیری: ${code} — axoncore.ir/track-order`);
  },
};

export const sendSMS               = smsService.sendSMS.bind(smsService);
export const sendOtp               = smsService.sendOtp.bind(smsService);
export const verifyOtp             = smsService.verifyOtp.bind(smsService);
export const sendVerificationSMS   = async (phone: string, code: string) => {
  const { sendOtpPattern } = await import("@/lib/otpService");
  return sendOtpPattern({ mobile: phone, code });
};
export default smsService;
