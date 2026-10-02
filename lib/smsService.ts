// File Path: lib/smsService.ts
import { sendOtpPattern, sendTextSMS } from "@/lib/otpService";

export async function sendVerificationSMS(phone: string, code: string) {
  const ok = await sendOtpPattern({ mobile: phone, code: String(code) });
  return { success: ok };
}

export async function sendOrderNotificationSMS(
  customerPhone: string,
  customerName: string,
  orderNumber: string
) {
  return await sendTextSMS(
    customerPhone,
    customerName + " عزیز، سفارش " + orderNumber + " در آکسون کور ثبت شد."
  );
}
