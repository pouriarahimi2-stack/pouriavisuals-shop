const API_KEY = process.env.IPPANEL_API_KEY;

interface SendOtpOptions {
  mobile: string;
  code: string; // کد تایید تصادفی
}

/**
 * ارسال پیامک پترن از طریق وب‌سرویس RESTful آی‌پی‌پنل با fetch بومی
 */
export async function sendOtpPattern({ mobile, code }: SendOtpOptions): Promise<boolean> {
  try {
    const patternCode = process.env.IPPANEL_PATTERN_CODE;
    const originator = process.env.IPPANEL_ORIGIN_NUMBER;

    if (!API_KEY || !patternCode || !originator) {
      throw new Error("IPPanel configuration variables are missing in .env");
    }

    // ساختار استاندارد درخواست به وب‌سرویس پترن IPPanel
    const payload = {
      code: patternCode,
      sender: originator,
      recipient: mobile,
      variable: {
        code: code // نام متغیر پترن شما در پنل (معمولا code یا otp است)
      }
    };

    const response = await fetch("https://api.ippanel.com/v1/api/send/pattern", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY // ارسال امن کلید API در هدر
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("IPPanel API Error:", data);
      return false;
    }

    console.log("OTP Pattern sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Failed to send OTP pattern request:", error);
    return false;
  }
}