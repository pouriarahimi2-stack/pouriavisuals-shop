// File Path: lib/otpService.ts
import https from "https";

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

const IRAN_EDGE_IPS: Record<string, string[]> = {
  "edge.ippanel.com": ["185.143.233.131","185.143.234.131"],
  "api2.ippanel.com": ["185.143.233.131","185.143.234.131"],
};

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

function httpsPostViaIranNode(
  urlStr: string,
  headers: Record<string, string>,
  bodyObj: Record<string, any>,
  pinnedIp?: string,
  timeoutMs = 5000
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const payload = JSON.stringify(bodyObj);

    const reqOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      servername: parsedUrl.hostname,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(payload).toString(),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0",
        ...headers,
      },
      timeout: timeoutMs,
    };

    if (pinnedIp) {
      reqOptions.lookup = (hostname, options: any, cb: any) => {
        if (options && options.all) {
          return cb(null, [{ address: pinnedIp, family: 4 }]);
        }
        return cb(null, pinnedIp, 4);
      };
    }

    const req = https.request(reqOptions, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          const cleanText = raw
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          parsed = { rawSummary: cleanText.slice(0, 180) || "HTTP " + (res.statusCode || 500) };
        }
        resolve({ status: res.statusCode || 500, data: parsed });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Request Timeout"));
    });
    req.on("error", (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
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
  const edgePinnedIp = IRAN_EDGE_IPS["edge.ippanel.com"]?.[0];
  const api2PinnedIp = IRAN_EDGE_IPS["api2.ippanel.com"]?.[0];

  // ۱. ارسال از طریق Edge API با متغیر دقیق vefification-code
  for (const pinIp of [edgePinnedIp, undefined]) {
    try {
      const resEdge = await httpsPostViaIranNode(
        "https://edge.ippanel.com/v1/api/send",
        { Authorization: padded },
        {
          sending_type: "pattern",
          from_number: originNumber,
          code: patternCode,
          recipients: [recipientE164],
          params: {
            "vefification-code": cleanCode,
          },
        },
        pinIp
      );

      attemptsLog.push({
        gw: "edge.ippanel.com",
        routedIp: pinIp || "default-dns",
        status: resEdge.status,
        res: resEdge.data,
      });

      if (
        resEdge.status >= 200 &&
        resEdge.status < 300 &&
        resEdge.data?.meta?.status !== false &&
        !resEdge.data?.rawSummary
      ) {
        return {
          ok: true,
          provider: "IPPanel-Edge",
          status: resEdge.status,
          rawResponse: resEdge.data,
        };
      }

      if (resEdge.status !== 502 && resEdge.status !== 504) {
        break;
      }
    } catch (err: any) {
      attemptsLog.push({
        gw: "edge.ippanel.com",
        routedIp: pinIp || "default-dns",
        error: err?.message,
      });
    }
  }

  // ۲. ارسال از طریق API2 IPPanel با متغیر دقیق vefification-code
  for (const pinIp of [api2PinnedIp, undefined]) {
    try {
      const resApi2 = await httpsPostViaIranNode(
        "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
        { apikey: padded },
        {
          code: patternCode,
          sender: originNumber,
          recipient: recipientLocal,
          variable: {
            "vefification-code": cleanCode,
          },
        },
        pinIp
      );

      attemptsLog.push({
        gw: "api2.ippanel.com",
        routedIp: pinIp || "default-dns",
        status: resApi2.status,
        res: resApi2.data,
      });

      if (
        resApi2.status >= 200 &&
        resApi2.status < 300 &&
        resApi2.data?.status === "OK"
      ) {
        return {
          ok: true,
          provider: "IPPanel-API2",
          status: resApi2.status,
          rawResponse: resApi2.data,
        };
      }

      if (resApi2.status !== 502 && resApi2.status !== 504) {
        break;
      }
    } catch (err: any) {
      attemptsLog.push({
        gw: "api2.ippanel.com",
        routedIp: pinIp || "default-dns",
        error: err?.message,
      });
    }
  }

  const errorMsg =
    attemptsLog.find((a) => a.res?.meta?.message)?.res?.meta?.message ||
    attemptsLog.find((a) => a.res?.error_message)?.res?.error_message ||
    attemptsLog.find((a) => a.res?.rawSummary)?.res?.rawSummary ||
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
