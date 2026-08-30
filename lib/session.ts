// File Path: lib/session.ts
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "axon_admin_super_secret_session_key_2026_secure_engine";

export function signPayload(payload: any): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = createHmac("sha256", SESSION_SECRET);
  hmac.update(data);
  const signature = hmac.digest("base64url");
  return `${data}.${signature}`;
}

export function verifyPayload(token: string): any | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;

    const hmac = createHmac("sha256", SESSION_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
      return null;
    }

    const jsonStr = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}