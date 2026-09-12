/**
 * Enterprise HMAC-SHA256 Session Engine
 * Complies with OWASP & Zero-Trust Architecture
 */

export interface AdminSessionPayload {
  id: string;
  username: string;
  role: string;
  full_name?: string;
  sid: string;
  iat: number;
  exp: number;
}

const COOKIE_NAME = "admin_session_token";
const SESSION_EXPIRY_SECONDS = 24 * 60 * 60; // ۲۴ ساعت اعتبار دقیق

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SECURITY RUNTIME ERROR: ADMIN_SESSION_SECRET environment variable is missing. The system refuses to boot without a cryptographically secure key."
    );
  }

  // بررسی حداقل طول ۳۲ بایتی (۲۵۶ بیتی) برای مقاومت در برابر Brute-force
  if (secret.length < 32) {
    throw new Error(
      "SECURITY RUNTIME ERROR: ADMIN_SESSION_SECRET must be at least 32 characters (256-bit entropy)."
    );
  }

  return secret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlToUint8Array(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

async function getCryptoKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secretBuffer = enc.encode(getSecretKey());
  return await crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

/**
 * تولید توکن امن با HMAC-SHA256، شناسه نشست یکتا و تاریخ انقضا
 */
export async function signPayload(
  data: Omit<AdminSessionPayload, "iat" | "exp" | "sid"> & { expSeconds?: number; sid?: string }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expSeconds = data.expSeconds || SESSION_EXPIRY_SECONDS;
  const sid = data.sid || "sid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

  const payload: AdminSessionPayload = {
    id: data.id,
    username: data.username,
    role: data.role,
    full_name: data.full_name,
    sid,
    iat: now,
    exp: now + expSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey("sign");
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(unsignedToken));
  const signature = bufferToBase64Url(signatureBuffer);

  return `${unsignedToken}.${signature}`;
}

/**
 * اعتبارسنجی Constant-Time با crypto.subtle.verify و بررسی انقضا
 */
export async function verifyPayload(token: string | null | undefined): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey("verify");
    const enc = new TextEncoder();
    const signatureBytes = base64UrlToUint8Array(signature);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as any,
      enc.encode(unsignedToken)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
