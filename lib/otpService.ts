// File Path: lib/otpService.ts
interface OtpOptions {
  mobile: string;
  code: string;
}

const DEFAULT_IPPANEL_KEY =
  "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMmM1OTdmN2M4NDdlMjc1ZmFmYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY";
const DEFAULT_PATTERN_CODE = "3d6fa1f8ud3ma1w";
const DEFAULT_ORIGINATOR = "+983000505";

function toE164(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("98")) return "+" + d;
  if (d.startsWith("09")) return "+98" + d.slice(1);
  if (d.startsWith("9") && d.length === 10) return "+98" + d;
  return "+" + d;
}

function toLocalZero(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("98")) return "0" + d.slice(2);
  if (d.startsWith("9") && d.length === 10) return "0" + d;
  return d;
}

export async function sendOtpPattern({ mobile, code }: OtpOptions): Promise<boolean> {
  const apiKey = process.env.IPPANEL_API_KEY || DEFAULT_IPPANEL_KEY;
  const patternCode = process.env.IPPANEL_PATTERN_CODE || DEFAULT_PATTERN_CODE;
  const originator = process.env.IPPANEL_ORIGIN_NUMBER || DEFAULT_ORIGINATOR;

  const recipientE164 = toE164(mobile);
  const recipientZero = toLocalZero(mobile);

  // ۱. روش اول: API2 IPPanel (مطابق تنظیمات اصلی پروژه شما در lib/smsService.ts)
  try {
    const res1 = await fetch("https://api2.ippanel.com/api/v1/sms/pattern/normal/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        code: patternCode,
        sender: originator,
        recipient: recipientZero,
        variable: {
          code: String(code),
          "vefification-code": String(code),
          "verification-code": String(code),
        },
      }),
    });
    if (res1.ok) return true;
  } catch {}

  // ۲. روش دوم: Edge IPPanel
  try {
    const res2 = await fetch("https://edge.ippanel.com/v1/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        sending_type: "pattern",
        from_number: originator,
        code: patternCode,
        recipients: [recipientE164],
        params: {
          code: String(code),
          "vefification-code": String(code),
        },
      }),
    });
    if (res2.ok) return true;
  } catch {}

  // ۳. روش سوم: Classic IPPanel
  try {
    const res3 = await fetch("https://api.ippanel.com/v1/api/send/pattern", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        code: patternCode,
        sender: originator,
        recipient: recipientZero,
        variable: {
          code: String(code),
          "vefification-code": String(code),
        },
      }),
    });
    if (res3.ok) return true;
  } catch {}

  return false;
}

export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  const apiKey = process.env.IPPANEL_API_KEY || DEFAULT_IPPANEL_KEY;
  const originator = process.env.IPPANEL_ORIGIN_NUMBER || DEFAULT_ORIGINATOR;
  const recipient = toE164(mobile);

  try {
    const res = await fetch("https://edge.ippanel.com/v1/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        sending_type: "webservice",
        from_number: originator,
        message,
        recipients: [recipient],
      }),
    });
    if (res.ok) return true;
  } catch {}

  // در صورتی که خط خدماتی فقط پترن قبول کند، کدهای داخل متن را با پترن ارسال کن
  const extractedDigits = message.match(/\b\d{4,8}\b/);
  if (extractedDigits) {
    return sendOtpPattern({ mobile, code: extractedDigits[0] });
  }
  return false;
}
