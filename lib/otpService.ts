/**
 * lib/otpService.ts
 * IPPanel — دو روش ارسال:
 * ۱. Edge API (https://edge.ippanel.com/v1/api/send)
 * ۲. Classic API (https://api.ippanel.com/v1/api/send/pattern) — fallback
 */

interface OtpOptions { mobile: string; code: string; }

function toE164(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("98")) return "+" + d;
  if (d.startsWith("09")) return "+98" + d.slice(1);
  if (d.startsWith("9") && d.length === 10) return "+98" + d;
  return "+" + d;
}

export async function sendOtpPattern({ mobile, code }: OtpOptions): Promise<boolean> {
  const apiKey      = process.env.IPPANEL_API_KEY;
  const patternCode = process.env.IPPANEL_PATTERN_CODE;
  const originator  = process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";

  // محیط توسعه — فقط log کن
  if (!apiKey || !patternCode) {
    console.log("[OTP DEV] کد:", code, "→ موبایل:", mobile);
    return true; // در dev موفق تلقی میشه
  }

  const recipient = toE164(mobile);

  // روش اول: Edge API
  try {
    const res = await fetch("https://edge.ippanel.com/v1/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": apiKey },
      body: JSON.stringify({
        sending_type: "pattern",
        from_number:  originator,
        code:         patternCode,
        recipients:   [recipient],
        params:       { code },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.meta?.status !== false) {
      console.log("[OTP] Edge API موفق:", recipient);
      return true;
    }
    console.warn("[OTP] Edge API رد کرد، fallback...", data?.meta?.message);
  } catch (e) {
    console.warn("[OTP] Edge API خطا، fallback...");
  }

  // روش دوم: Classic API
  try {
    const res = await fetch("https://api.ippanel.com/v1/api/send/pattern", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify({
        code:      patternCode,
        sender:    originator,
        recipient,
        variable:  { code },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.status !== "error") {
      console.log("[OTP] Classic API موفق:", recipient);
      return true;
    }
    console.error("[OTP] Classic API هم رد کرد:", data);
    return false;
  } catch (e) {
    console.error("[OTP] هر دو روش شکست خورد:", e);
    return false;
  }
}

export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  const apiKey    = process.env.IPPANEL_API_KEY;
  const originator= process.env.IPPANEL_ORIGIN_NUMBER || "+983000505";

  if (!apiKey) {
    console.log("[SMS DEV]", mobile, ":", message);
    return true;
  }

  const recipient = toE164(mobile);

  try {
    const res = await fetch("https://edge.ippanel.com/v1/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": apiKey },
      body: JSON.stringify({
        sending_type: "webservice",
        from_number:  originator,
        message,
        recipients:   [recipient],
      }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data?.meta?.status !== false;
  } catch {
    return false;
  }
}
