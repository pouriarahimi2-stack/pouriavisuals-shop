// File Path: lib/otpService.ts
import { postViaNetafrazRelay } from "@/lib/netafrazRelay";

export interface OtpOptions {
  mobile: string;
  code: string;
}

export interface SmsSendResult {
  ok: boolean;
  provider?: string;
  status?: number;
  errorCode?: string;
  errorMessage?: string;
  userSafeMessage: string;
  adminTechnicalDiagnosis: string;
  adminSolutionGuide: string[];
  rawResponse?: any;
}

const RAW_KEY_UNPADDED =
  "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMjM1OTdmN2M4NDdlMjc1ZmJhYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY";
const RAW_KEY_PADDED = RAW_KEY_UNPADDED + "=";
const EXACT_ORIGIN_NUMBER = "+983000505";
const EXACT_PATTERN_CODE = "3d6fa1f8ud3ma1w";
const NETAFRAZ_STATIC_IP = "185.106.201.79";

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
  let envKey = (process.env.IPPANEL_API_KEY || RAW_KEY_PADDED)
    .replace(/["'\s]/g, "")
    .trim();

  if (!envKey || envKey.includes("MmM1OTdm") || envKey.includes("ZmFmYTMx")) {
    envKey = RAW_KEY_PADDED;
  }

  const unpadded = envKey.replace(/=+$/, "");
  const padded =
    unpadded.length % 4 === 0
      ? unpadded
      : unpadded + "=".repeat(4 - (unpadded.length % 4));

  const rawOrigin = (process.env.IPPANEL_ORIGIN_NUMBER || EXACT_ORIGIN_NUMBER)
    .replace(/["'\s]/g, "")
    .trim();
  const originE164 = rawOrigin.startsWith("+") ? rawOrigin : toE164(rawOrigin);

  const patternCode = (process.env.IPPANEL_PATTERN_CODE || EXACT_PATTERN_CODE)
    .replace(/["'\s]/g, "")
    .trim();

  return {
    padded,
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
    return { rawSummary: cleanText.slice(0, 200) || "HTTP " + res.status };
  }
}

export async function sendOtpPatternDetailed({
  mobile,
  code,
}: OtpOptions): Promise<SmsSendResult> {
  const { padded, originNumber, patternCode } = getCleanCredentials();
  const recipientE164 = toE164(mobile);
  const recipientLocal = toLocalZero(mobile);
  const cleanCode = String(code).trim();

  const attemptsLog: Array<Record<string, any>> = [];

  // ۱. تلاش اول: ارسال از طریق پل هاست نت‌افراز شما (gate.axoncore.ir -> 185.106.201.79)
  const relayResult = await postViaNetafrazRelay(
    "https://edge.ippanel.com/v1/api/send",
    { Authorization: padded },
    {
      sending_type: "pattern",
      from_number: originNumber,
      code: patternCode,
      recipients: [recipientE164],
      params: { "vefification-code": cleanCode },
    }
  );

  if (relayResult) {
    attemptsLog.push({
      gateway: "Netafraz-Iran-Relay (" + relayResult.relayUrl + ")",
      httpStatus: relayResult.status,
      responseBody: relayResult.data,
    });

    if (
      relayResult.status >= 200 &&
      relayResult.status < 300 &&
      relayResult.data?.meta?.status !== false
    ) {
      return {
        ok: true,
        provider: "Netafraz-Iran-Relay",
        status: relayResult.status,
        userSafeMessage: "کد تایید پیامکی با موفقیت ارسال گردید.",
        adminTechnicalDiagnosis: "ارسال موفق از طریق هاست نت‌افراز شما (185.106.201.79).",
        adminSolutionGuide: [],
        rawResponse: relayResult.data,
      };
    }
  } else {
    attemptsLog.push({
      gateway: "Netafraz-Iran-Relay (https://gate.axoncore.ir/axon-relay.php)",
      status: "NOT_UPLOADED_YET",
      note: "فایل axon-relay.php هنوز روی ساب‌دامنه gate.axoncore.ir در هاست نت‌افراز آپلود نشده است.",
    });
  }

  // ۲. تلاش دوم: اتصال مستقیم از سرور جاری به درگاه‌های IPPanel
  const gateways: Array<{
    name: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, any>;
  }> = [
    {
      name: "edge.ippanel.com",
      url: "https://edge.ippanel.com/v1/api/send",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: padded,
      },
      body: {
        sending_type: "pattern",
        from_number: originNumber,
        code: patternCode,
        recipients: [recipientE164],
        params: { "vefification-code": cleanCode },
      },
    },
    {
      name: "rest.ippanel.com",
      url: "https://rest.ippanel.com/v1/messages/patterns/send",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "AccessKey " + padded,
      },
      body: {
        pattern_code: patternCode,
        originator: originNumber,
        recipient: recipientE164,
        values: { "vefification-code": cleanCode },
      },
    },
    {
      name: "api2.ippanel.com",
      url: "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apikey: padded,
      },
      body: {
        code: patternCode,
        sender: originNumber,
        recipient: recipientLocal,
        variable: { "vefification-code": cleanCode },
      },
    },
  ];

  for (const gw of gateways) {
    try {
      const res = await fetchWithTimeout(gw.url, {
        method: "POST",
        headers: gw.headers,
        body: JSON.stringify(gw.body),
      });

      const parsed = await parseResponseSafe(res);
      const isArvan502 =
        res.status === 502 &&
        String(parsed?.rawSummary || "").includes("temporarily inaccessible");

      attemptsLog.push({
        gateway: gw.name,
        httpStatus: res.status,
        blockedByArvanCloudWAF: isArvan502,
        responseBody: parsed,
      });

      if (
        res.ok &&
        parsed?.meta?.status !== false &&
        parsed?.status !== "error" &&
        !parsed?.rawSummary
      ) {
        return {
          ok: true,
          provider: gw.name,
          status: res.status,
          userSafeMessage: "کد تایید پیامکی با موفقیت ارسال گردید.",
          adminTechnicalDiagnosis: "ارسال موفق از طریق " + gw.name,
          adminSolutionGuide: [],
          rawResponse: parsed,
        };
      }
    } catch (err: any) {
      attemptsLog.push({
        gateway: gw.name,
        networkError: err?.message || "Connection Failed",
      });
    }
  }

  const hasArvan502 = attemptsLog.some((a) => a.blockedByArvanCloudWAF === true);
  const firstStatus = attemptsLog.find((a) => a.httpStatus)?.httpStatus || 502;
  const diagnosisText = hasArvan502
    ? "خطای 502 از فایروال ابرآروان: درخواست از سرور Vercel (آمریکا) ارسال شده و فایل axon-relay.php هنوز روی ساب‌دامنه gate.axoncore.ir در هاست نت‌افراز شما فعال نشده است."
    : "خطا در پاسخ وب‌سرویس پیامک با کد وضعیت HTTP " + firstStatus;

  return {
    ok: false,
    status: firstStatus,
    errorCode: hasArvan502 ? "ARVANCLOUD_FOREIGN_IP_BLOCK_502" : "SMS_PROVIDER_HTTP_" + firstStatus,
    errorMessage: diagnosisText,
    userSafeMessage: "خطا در ارسال پیامک تایید. لطفاً لحظاتی دیگر مجدداً تلاش کنید.",
    adminTechnicalDiagnosis: diagnosisText,
    adminSolutionGuide: [
      "۱. در پنل دایرکت‌ادمین نت‌افراز (netafraz.com)، در بخش «مدیریت زیر دامنه‌ها (Subdomain Management)»، یک زیر دامنه به نام gate بسازید (gate.axoncore.ir).",
      "۲. فایل axon-relay.php که در پوشه اصلی پروژه شما ساخته شده را در مسیر domains/axoncore.ir/public_html/gate/axon-relay.php آپلود کنید.",
      "۳. آی‌پی ثابت هاست نت‌افراز خود (" + NETAFRAZ_STATIC_IP + ") را در پنل زرین‌پال ثبت نمایید.",
    ],
    rawResponse: attemptsLog,
  };
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
