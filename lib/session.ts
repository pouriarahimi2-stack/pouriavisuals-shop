/**
 * Strict Cryptographic Session Engine
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

export const COOKIE_NAME = "admin_session_token";
const SESSION_EXPIRY_SECONDS = 72 * 60 * 60; // 72 hours

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.trim().length < 16) {
    throw new Error("FATAL SECURITY ERROR: ADMIN_SESSION_SECRET is missing. Refusing to boot insecurely.");
  }
  return secret.trim();
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
  while (base64.length % 4) base64 += "=";
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
  while (base64.length % 4) base64 += "=";
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
  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  const key = await getCryptoKey("sign");
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(unsignedToken));
  return `${unsignedToken}.${bufferToBase64Url(signatureBuffer)}`;
}

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
    const payload: AdminSessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
