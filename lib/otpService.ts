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

const RAW_KEY_UNPADDED =
  "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMjM1OTdmN2M4NDdlMjc1ZmJhYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY";
const RAW_KEY_PADDED = RAW_KEY_UNPADDED + "=";
const EXACT_ORIGIN_NUMBER = "+983000505";
const EXACT_PATTERN_CODE = "3d6fa1f8ud3ma1w";

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
  const padded = unpadded.length % 4 === 0 ? unpadded : unpadded + "=".repeat(4 - (unpadded.length % 4));

  const rawOrigin = (process.env.IPPANEL_ORIGIN_NUMBER || EXACT_ORIGIN_NUMBER)
    .replace(/["'\s]/g, "")
    .trim();
  const originE164 = rawOrigin.startsWith("+") ? rawOrigin : toE164(rawOrigin);

  const patternCode = (process.env.IPPANEL_PATTERN_CODE || EXACT_PATTERN_CODE)
    .replace(/["'\s]/g, "")
    .trim();

  return {
    padded,
    unpadded,
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
    return { rawSummary: cleanText.slice(0, 180) || "HTTP " + res.status };
  }
}

export async function sendOtpPatternDetailed({
  mobile,
  code,
}: OtpOptions): Promise<SmsSendResult> {
  const { padded, unpadded, originNumber, patternCode } = getCleanCredentials();
  const recipientE164 = toE164(mobile);
  const recipientLocal = toLocalZero(mobile);
  const cleanCode = String(code).trim();

  const attemptsLog: Array<Record<string, any>> = [];

  // ۱. تست درگاه API2 IPPanel (که کلیدهای Base64 استاندارد UUID+Hash برای آن صادر می‌شوند)
  for (const keyCandidate of [padded, unpadded]) {
    for (const varObj of [{ code: cleanCode }, { "verification-code": cleanCode }]) {
      try {
        const resApi2 = await fetchWithTimeout(
          "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              apikey: keyCandidate,
            },
            body: JSON.stringify({
              code: patternCode,
              sender: originNumber,
              recipient: recipientLocal,
              variable: varObj,
            }),
          }
        );

        const parsed2 = await parseResponseSafe(resApi2);
        const isArvan502 =
          resApi2.status === 502 &&
          String(parsed2?.rawSummary || "").includes("temporarily inaccessible");

        attemptsLog.push({
          gw: "api2.ippanel.com",
          status: resApi2.status,
          arvanFirewallBlocked: isArvan502,
          res: parsed2,
        });

        if (resApi2.ok && parsed2?.status === "OK") {
          return {
            ok: true,
            provider: "IPPanel-API2",
            status: resApi2.status,
            rawResponse: parsed2,
          };
        }
        if (resApi2.status === 502 || resApi2.status === 401 || resApi2.status === 403) break;
      } catch (e: any) {
        attemptsLog.push({ gw: "api2.ippanel.com", error: e?.message });
        break;
      }
    }
  }

  // ۲. تست درگاه Edge با هر ۴ حالت هدر Authorization
  const edgeAuthCandidates = [
    padded,
    "AccessKey " + padded,
    "Bearer " + padded,
    unpadded,
  ];

  for (const authHeader of edgeAuthCandidates) {
    try {
      const resEdge = await fetchWithTimeout("https://edge.ippanel.com/v1/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          sending_type: "pattern",
          from_number: originNumber,
          code: patternCode,
          recipients: [recipientE164],
          params: {
            code: cleanCode,
          },
        }),
      });

      const parsedEdge = await parseResponseSafe(resEdge);
      const isArvan502 =
        resEdge.status === 502 &&
        String(parsedEdge?.rawSummary || "").includes("temporarily inaccessible");

      attemptsLog.push({
        gw: "edge.ippanel.com",
        status: resEdge.status,
        arvanFirewallBlocked: isArvan502,
        res: parsedEdge,
      });

      if (resEdge.ok && parsedEdge?.meta?.status !== false && !parsedEdge?.rawSummary) {
        return {
          ok: true,
          provider: "IPPanel-Edge",
          status: resEdge.status,
          rawResponse: parsedEdge,
        };
      }
      if (isArvan502) break;
    } catch (e: any) {
      attemptsLog.push({ gw: "edge.ippanel.com", error: e?.message });
      break;
    }
  }

  const isArvan502 = attemptsLog.some((a) => a.arvanFirewallBlocked === true);
  const errorMsg = isArvan502
    ? "فایروال ابرآروانِ IPPanel ارتباط از آی‌پی خارج از کشور (سرور Vercel) را با کد 502 مسدود کرده است."
    : attemptsLog.find((a) => a.res?.error_message)?.res?.error_message ||
      attemptsLog.find((a) => a.res?.meta?.message)?.res?.meta?.message ||
      "HTTP " + (attemptsLog[0]?.status || 502);

  return {
    ok: false,
    status: attemptsLog[0]?.status || 502,
    errorMessage: errorMsg,
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
