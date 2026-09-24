// File Path: services/smsService.ts

export interface SendSmsResponse {
  success:        boolean;
  message?:       string;
  simulatedCode?: string;
  token?:         string;
  verified?:      boolean;
}

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  if (process.env.NEXT_PUBLIC_SITE_URL)  return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_URL)            return "https://" + process.env.VERCEL_URL;
  return "http://localhost:3000";
}

function cleanPhone(phone: string): string {
  return String(phone)
    .trim()
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/\D/g, "");
}

export const smsService = {
  async sendOtp(phone: string): Promise<SendSmsResponse> {
    try {
      const cp  = cleanPhone(phone);
      const url = getApiBaseUrl() + "/api/send-otp";
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cp, action: "send" }),
        cache:   "no-store",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "خطا در ارسال OTP.");
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در ارتباط با سامانه پیامک." };
    }
  },

  async verifyOtp(phone: string, code: string, token?: string): Promise<SendSmsResponse> {
    try {
      const cp   = cleanPhone(phone);
      const cc   = cleanPhone(code);
      const url  = getApiBaseUrl() + "/api/send-otp";
      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cp, code: cc, token, action: "verify" }),
        cache:   "no-store",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "کد تایید نادرست است.");
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || "خطا در بررسی کد." };
    }
  },

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const cp  = cleanPhone(phone);
      const url = getApiBaseUrl() + "/api/sms/send";
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: cp, message }),
        cache:   "no-store",
      });
      const json = await res.json().catch(() => ({}));
      return res.ok && json.success === true;
    } catch {
      return false;
    }
  },

  async sendTrackingCode(phone: string, customerName: string, trackingCode: string): Promise<boolean> {
    const msg = customerName + " گرامی، سفارش شما تحویل شرکت ملی پست گردید. کد رهگیری مرسوله پیشتاز: " + trackingCode + " - پیگیری: axoncore.ir/track-order";
    return this.sendSMS(phone, msg);
  },

  async sendOrderStatusChange(phone: string, orderId: string, statusName: string): Promise<boolean> {
    const msg = "خریدار گرامی، وضعیت سفارش #" + orderId + " شما در آکسون به «" + statusName + "» تغییر یافت. پیگیری: axoncore.ir/track-order";
    return this.sendSMS(phone, msg);
  },

  async sendOrderPaidConfirmation(phone: string, orderId: string, amount: number): Promise<boolean> {
    const fa  = Math.round(amount).toLocaleString("fa-IR");
    const msg = "سفارش #" + orderId + " به مبلغ " + fa + " تومان با موفقیت پرداخت شد. سپاس از خرید شما - آکسون کور";
    return this.sendSMS(phone, msg);
  },
};

export const sendSMS               = smsService.sendSMS.bind(smsService);
export const sendOtp               = smsService.sendOtp.bind(smsService);
export const verifyOtp             = smsService.verifyOtp.bind(smsService);
export const sendTrackingCode      = smsService.sendTrackingCode.bind(smsService);
export const sendOrderStatusChange = smsService.sendOrderStatusChange.bind(smsService);
export const sendVerificationSMS   = async (phone: string, code: string): Promise<boolean> => {
  const { sendOtpPattern } = await import("@/lib/otpService");
  return sendOtpPattern({ mobile: phone, code });
};
export default smsService;
