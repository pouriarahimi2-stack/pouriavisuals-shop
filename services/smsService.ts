export const smsService = {
  async sendOrderStatusChange(phone: string, orderId: string, status: string): Promise<boolean> {
    try {
      if (!phone) return false;
      const cleanPhone = phone.replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");
      
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          action: "order_status",
          orderId,
          status,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async sendOtp(phone: string): Promise<{ success: boolean; simulatedCode?: string; message?: string }> {
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" }),
      });
      return await res.json();
    } catch {
      return { success: false, message: "خطا در ارتباط با وب‌سرویس پیامک" };
    }
  },

  async verifyOtp(phone: string, code: string): Promise<{ success: boolean; verified?: boolean; message?: string }> {
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, action: "verify" }),
      });
      return await res.json();
    } catch {
      return { success: false, message: "خطا در بررسی کد" };
    }
  }
};

export default smsService;