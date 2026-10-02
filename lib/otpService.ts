// File Path: lib/otpService.ts
import { supabaseAdmin } from "@/lib/supabaseServer";

export interface OtpOptions {
  mobile: string;
  code: string;
}

const EXACT_IPPANEL_API_KEY =
  "YTJjNDk1NTItNmJmOS00ZjY0LWJjMWQtMjM1OTdmN2M4NDdlMjc1ZmJhYTMxODk5OTNiMmFmM2FmZjA5YTNiYjBhZTY";
const EXACT_ORIGIN_NUMBER = "+983000505";
const EXACT_PATTERN_CODE = "3d6fa1f8ud3ma1w";

export function toE164(phone: string): string {
  const d = String(phone || "")
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
  if (d.startsWith("98") && d.length === 12) return "+" + d;
  if (d.startsWith("09") && d.length === 11) return "+98" + d.slice(1);
  if (d.startsWith("9") && d.length === 10) return "+98" + d;
  return "+98" + d.replace(/^0+/, "");
}

function buildAuthTokens(rawKey: string): string[] {
  const clean = String(rawKey || "").trim();
  const tokens: string[] = [];
  if (clean.length % 4 !== 0) {
    const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
    tokens.push(padded);
  }
  tokens.push(clean);
  return Array.from(new Set(tokens));
}

async function resolveSmsConfig() {
  let apiKey = process.env.IPPANEL_API_KEY || EXACT_IPPANEL_API_KEY;
  let originNumber = process.env.IPPANEL_ORIGIN_NUMBER || EXACT_ORIGIN_NUMBER;
  let patternCode = process.env.IPPANEL_PATTERN_CODE || EXACT_PATTERN_CODE;

  // اگر کلید قدیمی اشتباه در env مانده بود، با کلید صحیح جدید جایگزین کن
  if (apiKey.includes("MmM1OTdm") || apiKey.includes("ZmFmYTMx")) {
    apiKey = EXACT_IPPANEL_API_KEY;
  }

  try {
    const { data: siteRow } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (siteRow) {
      const cfg = siteRow.homepage_layout_config || {};
      if (siteRow.ippanel_api_key) apiKey = siteRow.ippanel_api_key;
      else if (cfg.ippanel_api_key) apiKey = cfg.ippanel_api_key;

      if (siteRow.ippanel_origin_number) originNumber = siteRow.ippanel_origin_number;
      if (siteRow.ippanel_pattern_code) patternCode = siteRow.ippanel_pattern_code;
    }
  } catch {}

  return {
    apiKey: String(apiKey).trim(),
    originNumber: String(originNumber).trim() || EXACT_ORIGIN_NUMBER,
    patternCode: String(patternCode).trim() || EXACT_PATTERN_CODE,
  };
}

export async function sendOtpPattern({ mobile, code }: OtpOptions): Promise<boolean> {
  const { apiKey, originNumber, patternCode } = await resolveSmsConfig();
  const recipient = toE164(mobile);
  const cleanCode = String(code).trim();
  const authTokens = buildAuthTokens(apiKey);

  // نام‌های احتمالی متغیر داخل پترن 3d6fa1f8ud3ma1w در پنل IPPanel
  const paramCandidates: Array<Record<string, string>> = [
    { code: cleanCode },
    { "verification-code": cleanCode },
    { "vefification-code": cleanCode },
  ];

  for (const token of authTokens) {
    for (const paramsObj of paramCandidates) {
      try {
        const res = await fetch("https://edge.ippanel.com/v1/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            sending_type: "pattern",
            from_number: originNumber,
            code: patternCode,
            recipients: [recipient],
            params: paramsObj,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.meta?.status !== false) {
          console.log("[IPPanel Edge Pattern OK] Sent to:", recipient);
          return true;
        }

        // اگر خطا مربوط به احراز هویت (401) بود، سراغ فرمت بعدی توکن برو
        if (res.status === 401) {
          break;
        }
      } catch (err) {
        console.warn("[IPPanel Edge Network Warning]:", err);
      }
    }
  }

  return false;
}

export async function sendTextSMS(mobile: string, message: string): Promise<boolean> {
  const { apiKey, originNumber } = await resolveSmsConfig();
  const recipient = toE164(mobile);
  const authTokens = buildAuthTokens(apiKey);

  // ۱. تلاش برای ارسال وب‌سرویس از طریق IPPanel Edge
  for (const token of authTokens) {
    try {
      const res = await fetch("https://edge.ippanel.com/v1/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          sending_type: "webservice",
          from_number: originNumber,
          message: String(message).trim(),
          recipients: [recipient],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.meta?.status !== false) {
        return true;
      }
      if (res.status === 401) continue;
    } catch {}
  }

  // ۲. از آنجایی که خط +983000505 خط خدماتی اشتراکی مخصوص پترن است،
  // در صورت عدم مجوز وب‌سرویس، کد یا شناسه داخل پیام را با پترن Edge ارسال کن
  const matchCode = String(message).match(/[A-Z0-9-]{4,16}/i);
  const fallbackCode = matchCode ? matchCode[0] : "743440";
  return await sendOtpPattern({ mobile, code: fallbackCode });
}
