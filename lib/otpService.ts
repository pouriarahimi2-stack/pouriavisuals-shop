// File Path: lib/otpService.ts
export interface OtpOptions {
  mobile: string;
  code: string;
}

export interface SmsSendResult {
  ok: boolean;
  provider?: string;
  status?: number;
  errorMessage?: string;
  rawResponse?: any;
}

const EXACT_IPPANEL_API_KEY =
  "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMjM1OTdmN2M4NDdlMjc1ZmJhYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY";
const EXACT_ORIGIN_NUMBER = "+983000505";
const EXACT_PATTERN_CODE = "3d6fa1f8ud3ma1w";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export function toE164(phone: string): string {
  const d = String(phone || "")
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (d.startsWith("98") && d.length >= 11) return "+" + d;
  if (d.startsWith("09") && d.length === 11) return "+98" + d.slice(1);
  if (d.startsWith("9") && d.length === 10) return "+98" + d;
  if (
    d.startsWith("3000") ||
    d.startsWith("5000") ||
    d.startsWith("2000") ||
    d.startsWith("1000")
  ) {
    return "+98" + d;
  }
  return "+98" + d.replace(/^0+/, "");
}

export function toLocalZero(phone: string): string {
  const d = String(phone || "")
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (d.startsWith("98") && d.length === 12) return "0" + d.slice(2);
  if (d.startsWith("9") && d.length === 10) return "0" + d;
  return d;
}

function getCleanCredentials() {
  let rawKey = (process.env.IPPANEL_API_KEY || EXACT_IPPANEL_API_KEY)
    .replace(/["'\s]/g, "")
    .trim();

  if (!rawKey || rawKey.includes("MmM1OTdm") || rawKey.includes("ZmFmYTMx")) {
    rawKey = EXACT_IPPANEL_API_KEY;
  }

  const rawOrigin = (process.env.IPPANEL_ORIGIN_NUMBER || EXACT_ORIGIN_NUMBER)
    .replace(/["'\s]/g, "")
    .trim();
  const originE164 = rawOrigin.startsWith("+") ? rawOrigin : toE164(rawOrigin);

  const patternCode = (process.env.IPPANEL_PATTERN_CODE || EXACT_PATTERN_CODE)
    .replace(/["'\s]/g, "")
    .trim();

  return {
    apiKey: rawKey,
    originNumber: originE164 || EXACT_ORIGIN_NUMBER,
    patternCode: patternCode || EXACT_PATTERN_CODE,
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function sendOtpPatternDetailed({
  mobile,
  code,
}: OtpOptions): Promise<SmsSendResult> {
  const { apiKey, originNumber, patternCode } = getCleanCredentials();
  const recipientE164 = toE164(mobile);
  const recipientLocal = toLocalZero(mobile);
  const cleanCode = String(code).trim();

  let lastError = "";
  let lastRaw: any = null;
  let lastStatus = 0;

  const edgeParamsList: Array<Record<string, string>> = [
    { code: cleanCode },
    { "verification-code": cleanCode },
    { "vefification-code": cleanCode },
    { code: cleanCode, "verification-code": cleanCode, "vefification-code": cleanCode },
  ];

  // ۱. ارسال از طریق وب‌سرویس رسمی IPPanel Edge (https://edge.ippanel.com/v1/api/send)
  for (const paramsObj of edgeParamsList) {
    try {
      const res = await fetchWithTimeout("https://edge.ippanel.com/v1/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: apiKey,
          "User-Agent": BROWSER_USER_AGENT,
        },
        body: JSON.stringify({
          sending_type: "pattern",
          from_number: originNumber,
          code: patternCode,
          recipients: [recipientE164],
          params: paramsObj,
        }),
      });

      lastStatus = res.status;
      const data = await res.json().catch(() => ({}));
      lastRaw = data;

      if (res.ok && data?.meta?.status !== false) {
        return {
          ok: true,
          provider: "IPPanel-Edge",
          status: res.status,
          rawResponse: data,
        };
      }

      lastError =
        data?.meta?.message ||
        data?.message ||
        "Edge HTTP " + res.status;

      if (res.status === 401 || res.status === 403) {
        break;
      }
    } catch (err: any) {
      lastError = err?.message || "Edge Network Error";
      break;
    }
  }

  // ۲. فال‌بک به وب‌سرویس API2 IPPanel (https://api2.ippanel.com/api/v1/sms/pattern/normal/send)
  for (const rec of [recipientLocal, recipientE164]) {
    try {
      const res2 = await fetchWithTimeout(
        "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            apikey: apiKey,
            "User-Agent": BROWSER_USER_AGENT,
          },
          body: JSON.stringify({
            code: patternCode,
            sender: originNumber,
            recipient: rec,
            variable: {
              code: cleanCode,
              "verification-code": cleanCode,
              "vefification-code": cleanCode,
            },
          }),
        }
      );

      const data2 = await res2.json().catch(() => ({}));
      if (res2.ok && data2?.status !== "error" && data2?.code !== 401) {
        return {
          ok: true,
          provider: "IPPanel-API2",
          status: res2.status,
          rawResponse: data2,
        };
      }
      if (!lastError && data2?.error_message) {
        lastError = data2.error_message;
      }
    } catch {}
  }

  // ۳. فال‌بک به Classic Pattern API
  try {
    const res3 = await fetchWithTimeout("https://api.ippanel.com/v1/api/send/pattern", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apikey: apiKey,
        Authorization: apiKey,
        "User-Agent": BROWSER_USER_AGENT,
      },
      body: JSON.stringify({
        code: patternCode,
        sender: originNumber,
        recipient: recipientE164,
        variable: { code: cleanCode },
      }),
    });

    const data3 = await res3.json().catch(() => ({}));
    if (res3.ok && data3?.status !== "error") {
      return {
        ok: true,
        provider: "IPPanel-Classic",
        status: res3.status,
        rawResponse: data3,
      };
    }
  } catch {}

  return {
    ok: false,
    status: lastStatus,
    errorMessage: lastError || "عدم پاسخگویی درگاه پیامک",
    rawResponse: lastRaw,
  };
}

export async function sendOtpPattern(opts: OtpOptions): Promise<boolean> {
  const result = await sendOtpPatternDetailed(opts);
  return result.ok;
}

export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  const { apiKey, originNumber } = getCleanCredentials();
  const recipient = toE164(mobile);

  try {
    const res = await fetchWithTimeout("https://edge.ippanel.com/v1/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: apiKey,
        "User-Agent": BROWSER_USER_AGENT,
      },
      body: JSON.stringify({
        sending_type: "webservice",
        from_number: originNumber,
        message: String(message).trim(),
        recipients: [recipient],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.meta?.status !== false) return true;
  } catch {}

  const matchCode = String(message).match(/[A-Z0-9-]{4,16}/i);
  const fallbackCode = matchCode ? matchCode[0] : "743440";
  return await sendOtpPattern({ mobile, code: fallbackCode });
}
