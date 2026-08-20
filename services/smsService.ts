export interface SMSLog {
  id: string;
  phone: string;
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  created_at: string;
}

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  const cleanPhone = phone.trim().replace(/^(\+98|0098|98)/, '0');
  
  if (!/^09\d{9}$/.test(cleanPhone)) {
    return false;
  }

  const smsApiKey = process.env.SMS_API_KEY || process.env.KAVENEGAR_API_KEY;
  const isServer = typeof window === 'undefined';

  if (isServer) {
    if (smsApiKey) {
      try {
        const url = `https://api.kavenegar.com/v1/${smsApiKey}/sms/send.json`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            receptor: cleanPhone,
            message: message,
          }),
        });
        const data = await res.json();
        return data.return?.status === 200;
      } catch {
        return false;
      }
    } else {
      console.log(`[DEV SMS SIMULATOR] To: ${cleanPhone} | Message: ${message}`);
      return true;
    }
  }

  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

// آبجکت سازگار برای تمام کامپوننت‌های پنل و کلاینت
export const smsService = {
  sendSMS,
  sendOTP: async (phone: string, code: string) => sendSMS(phone, `کد ورود شما: ${code}`),
  sendOrderConfirmation: async (phone: string, orderId: string) => sendSMS(phone, `سفارش ${orderId} با موفقیت ثبت شد.`),
  sendShippingNotification: async (phone: string, trackingCode: string) => sendSMS(phone, `سفارش شما ارسال شد. کد رهگیری: ${trackingCode}`),
  getLogs: async (): Promise<SMSLog[]> => [],
};

export default smsService;