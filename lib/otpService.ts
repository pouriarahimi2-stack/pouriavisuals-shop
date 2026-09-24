/**
 * lib/otpService.ts
 * IPPanel Edge API — ارسال OTP با Pattern SMS
 * مستندات: https://ippanelcom.github.io/Edge-Document/docs/send/pattern
 * Base URL: https://edge.ippanel.com/v1
 */

interface SendOtpOptions {
  mobile: string; // فرمت: 09xxxxxxxxx
  code:   string; // کد ۶ رقمی
}

/**
 * تبدیل شماره ایرانی به فرمت E.164 که IPPanel نیاز دارد
 * 09123456789 → +989123456789
 */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("98")) return "+" + digits;
  if (digits.startsWith("09")) return "+98" + digits.slice(1);
  if (digits.startsWith("9") && digits.length === 10) return "+98" + digits;
  return "+" + digits;
}

export async function sendOtpPattern({ mobile, code }: SendOtpOptions): Promise<boolean> {
  try {
    const apiKey      = process.env.IPPANEL_API_KEY;
    const patternCode = process.env.IPPANEL_PATTERN_CODE;
    const fromNumber  = process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";

    if (!apiKey || !patternCode) {
      console.error("[OTP] متغیرهای IPPANEL_API_KEY یا IPPANEL_PATTERN_CODE تعریف نشده‌اند.");
      // در محیط توسعه، کد را log می‌کنیم
      if (process.env.NODE_ENV !== "production") {
        console.log("[OTP DEV] کد:", code, "به شماره:", mobile);
      }
      return process.env.NODE_ENV !== "production";
    }

    const recipient = toE164(mobile);

    // IPPanel Edge API — Send Pattern SMS
    // POST https://edge.ippanel.com/v1/api/send
    const payload = {
      sending_type: "pattern",
      from_number:  fromNumber,
      code:         patternCode,
      recipients:   [recipient],
      params: {
        code: code, // کلید باید با placeholder پترن در پنل IPPanel یکی باشد
      },
    };

    const response = await fetch("https://edge.ippanel.com/v1/api/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": apiKey, // IPPanel Edge از header Authorization استفاده می‌کند
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.meta?.status === false) {
      console.error("[OTP] IPPanel Edge API Error:", response.status, data?.meta?.message || data);
      return false;
    }

    console.log("[OTP] Pattern SMS ارسال شد به", recipient, "| bulk_id:", data?.data?.message_outbox_ids?.[0]);
    return true;
  } catch (error) {
    console.error("[OTP] خطا در ارسال پیامک:", error);
    return false;
  }
}

/**
 * ارسال پیامک متنی ساده (Webservice SMS)
 * POST https://edge.ippanel.com/v1/api/send
 */
export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  try {
    const apiKey     = process.env.IPPANEL_API_KEY;
    const fromNumber = process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";

    if (!apiKey) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[SMS DEV] پیام:", message, "به:", mobile);
        return true;
      }
      return false;
    }

    const recipient = toE164(mobile);

    const payload = {
      sending_type: "webservice",
      from_number:  fromNumber,
      message:      message,
      recipients:   [recipient],
    };

    const response = await fetch("https://edge.ippanel.com/v1/api/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.meta?.status === false) {
      console.error("[SMS] IPPanel Error:", response.status, data?.meta?.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[SMS] خطا:", error);
    return false;
  }
}
