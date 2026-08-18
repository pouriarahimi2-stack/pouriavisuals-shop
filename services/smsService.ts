export interface SMSLog {
  id: string;
  phone: string;
  message: string;
  status: "sent" | "failed";
  timestamp: string;
}

const SMS_LOGS_KEY = "system_sms_logs";

export const smsService = {
  async sendTrackingCode(phone: string, orderId: string, trackingCode: string): Promise<boolean> {
    const text = `مشتری گرامی، سفارش شما با شناسه ${orderId} تحویل شرکت ملی پست گردید.\nکد رهگیری پیشتاز: ${trackingCode}\nرهگیری در: https://tracking.post.ir`;
    return this.dispatchSMS(phone, text);
  },

  async sendOrderStatusChange(phone: string, orderId: string, statusText: string): Promise<boolean> {
    const text = `مشتری گرامی، وضعیت سفارش شما به شماره ${orderId} به حالت «${statusText}» تغییر یافت.`;
    return this.dispatchSMS(phone, text);
  },

  async dispatchSMS(phone: string, message: string): Promise<boolean> {
    try {
      console.log(`[SMS Service] Sending to ${phone}: \n${message}`);

      const logItem: SMSLog = {
        id: `sms_${Date.now()}`,
        phone,
        message,
        status: "sent",
        timestamp: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        const currentLogs: SMSLog[] = JSON.parse(localStorage.getItem(SMS_LOGS_KEY) || "[]");
        localStorage.setItem(SMS_LOGS_KEY, JSON.stringify([logItem, ...currentLogs]));
      }

      return true;
    } catch (e) {
      console.error("[SMS Service] Failed to send SMS:", e);
      return false;
    }
  },

  getLogs(): SMSLog[] {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(SMS_LOGS_KEY) || "[]");
  },
};