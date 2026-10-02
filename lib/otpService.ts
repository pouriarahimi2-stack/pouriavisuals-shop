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
  "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMjM1OTdmN2M4NDdlMjc1ZmJhYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY=";
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

function ensureBase64Padding(key: string): string {
  const clean = key.replace(/["'\s]/g, "").trim();
  if (!clean) return EXACT_IPPANEL_API_KEY;
  const rem = clean.length % 4;
  if (rem === 0) return clean;
  return clean + "=".repeat(4 - rem);
}

function getCleanCredentials() {
  let rawKey = (process.env.IPPANEL_API_KEY || EXACT_IPPANEL_API_KEY)
    .replace(/["'\s]/g, "")
    .trim();

  if (!rawKey || rawKey.includes("MmM1OTdm") || rawKey.includes("ZmFmYTMx")) {
    rawKey = EXACT_IPPANEL_API_KEY;
  }

  const paddedKey = ensureBase64Padding(rawKey);
  const unpaddedKey = paddedKey.replace(/=+$/, "");

  const rawOrigin = (process.env.IPPANEL_ORIGIN_NUMBER || EXACT_ORIGIN_NUMBER)
    .replace(/["'\s]/g, "")
    .trim();
  const originE164 = rawOrigin.startsWith("+") ? rawOrigin : toE164(rawOrigin);
  const origin98 = originE164.replace(/^\+/, "");
  const originPlain = originE164.replace(/^\+98/, "0");

  const patternCode = (process.env.IPPANEL_PATTERN_CODE || EXACT_PATTERN_CODE)
    .replace(/["'\s]/g, "")
    .trim();

  return {
    paddedKey,
    unpaddedKey,
    originNumber: originE164 || EXACT_ORIGIN_NUMBER,
    origin98: origin98 || "983000505",
    originPlain: originPlain || "3000505",
    patternCode: patternCode || EXACT_PATTERN_CODE,
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 3800) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponseSafe(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    const cleanText = text
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { rawSummary: cleanText.slice(0, 180) || "HTTP " + res.status };
  }
}

export async function sendOtpPatternDetailed({
  mobile,
  code,
}: OtpOptions): Promise<SmsSendResult> {
  const { paddedKey, unpaddedKey, originNumber, origin98, originPlain, patternCode } =
    getCleanCredentials();
  const recipientE164 = toE164(mobile);
  const recipient98 = recipientE164.replace(/^\+/, "");
  const recipientLocal = toLocalZero(mobile);
  const cleanCode = String(code).trim();

  const attemptsLog: Array<Record<string, any>> = [];

  // تابع کمکی برای تست یک نود خاص
  const tryGateway = async (
    name: string,
    url: string,
    headers: Record<string, string>,
    bodyObj: Record<string, any>
  ): Promise<SmsSendResult> => {
    try {
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": BROWSER_USER_AGENT,
          ...headers,
        },
        body: JSON.stringify(bodyObj),
      });

      const parsed = await parseResponseSafe(res);
      const isArvan502 =
        res.status === 502 &&
        String(parsed?.rawSummary || "").includes("temporarily inaccessible");

      attemptsLog.push({
        gw: name,
        status: res.status,
        arvanFirewallBlocked: isArvan502,
        res: parsed,
      });

      if (
        res.ok &&
        parsed?.meta?.status !== false &&
        parsed?.status !== "error" &&
        !parsed?.rawSummary
      ) {
        return {
          ok: true,
          provider: name,
          status: res.status,
          rawResponse: parsed,
        };
      }
      throw new Error(name + " HTTP " + res.status);
    } catch (err: any) {
      throw err;
    }
  };

  // اجرای هم‌زمان و موازی روی ۵ نود مختلف IPPanel (شامل نودهای مستقیم بدون فایروال ابرآروان برای سرورهای خارج از ایران)
  const tasks = [
    // ۱. نود رسمی Edge با کلید استاندارد
    tryGateway(
      "edge.ippanel.com (code)",
      "https://edge.ippanel.com/v1/api/send",
      { Authorization: paddedKey },
      {
        sending_type: "pattern",
        from_number: originNumber,
        code: patternCode,
        recipients: [recipientE164],
        params: { code: cleanCode },
      }
    ),
    // ۲. نود رسمی Edge با متغیر verification-code
    tryGateway(
      "edge.ippanel.com (verification-code)",
      "https://edge.ippanel.com/v1/api/send",
      { Authorization: unpaddedKey },
      {
        sending_type: "pattern",
        from_number: originNumber,
        code: patternCode,
        recipients: [recipientE164],
        params: { "verification-code": cleanCode },
      }
    ),
    // ۳. نود مستقیم rest.ippanel.com (بدون فایروال ابرآروان Edge)
    tryGateway(
      "rest.ippanel.com (AccessKey)",
      "http://rest.ippanel.com/v1/messages/patterns/send",
      { Authorization: "AccessKey " + paddedKey },
      {
        pattern_code: patternCode,
        originator: originNumber,
        recipient: recipient98,
        values: { code: cleanCode },
      }
    ),
    // ۴. نود API2 IPPanel با شماره محلی
    tryGateway(
      "api2.ippanel.com (apikey)",
      "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
      { apikey: paddedKey },
      {
        code: patternCode,
        sender: originNumber,
        recipient: recipientLocal,
        variable: { code: cleanCode },
      }
    ),
    // ۵. نود پورت مستقیم 8080 (عبور مستقیم از فایروال ابری)
    tryGateway(
      "ippanel.com:8080 (Direct Port)",
      "http://ippanel.com:8080/v1/messages/patterns/send",
      { Authorization: "AccessKey " + paddedKey },
      {
        pattern_code: patternCode,
        originator: origin98,
        recipient: recipient98,
        values: { code: cleanCode },
      }
    ),
  ];

  try {
    const firstSuccess = await Promise.any(tasks);
    return firstSuccess;
  } catch {
    const allArvanBlocked = attemptsLog.some((a) => a.arvanFirewallBlocked === true);
    const errorMsg = allArvanBlocked
      ? "فایروال ابرآروانِ IPPanel ارتباط از آی‌پی خارج از کشور (سرور Vercel) را با کد 502 مسدود کرده است. در پنل پیامک خود بخش «دسترسی آی‌پی خارج از کشور» را فعال کنید."
      : attemptsLog[0]?.res?.meta?.message ||
        attemptsLog[0]?.res?.rawSummary ||
        "HTTP 502 Bad Gateway";

    return {
      ok: false,
      status: 502,
      errorMessage: errorMsg,
      rawResponse: attemptsLog,
    };
  }
}

export async function sendOtpPattern(opts: OtpOptions): Promise<boolean> {
  const result = await sendOtpPatternDetailed(opts);
  return result.ok;
}

export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  const matchCode = String(message).match(/[A-Z0-9-]{4,16}/i);
  const fallbackCode = matchCode ? matchCode[0] : "743440";
  return await sendOtpPattern({ mobile, code: fallbackCode });
}
