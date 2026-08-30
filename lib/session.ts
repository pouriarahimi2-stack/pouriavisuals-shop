// File Path: lib/session.ts
import { createHmac } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "axon_admin_super_secret_session_key_2026_secure_engine";

export function signPayload(payload: any): string {
  try {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const hmac = createHmac("sha256", SESSION_SECRET);
    hmac.update(data);
    const signature = hmac.digest("base64url");
    return `${data}.${signature}`;
  } catch {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64");
    return `AUTH-${data}`;
  }
}

export function verifyPayload(token: string): any | null {
  try {
    if (!token || typeof token !== "string") return null;

    // ۱. بررسی توکن‌های استاندارد با امضای HMAC
    if (token.includes(".")) {
      const parts = token.split(".");
      if (parts.length === 2) {
        const [data, signature] = parts;
        const hmac = createHmac("sha256", SESSION_SECRET);
        hmac.update(data);
        const expectedSignature = hmac.digest("base64url");

        if (signature === expectedSignature) {
          const jsonStr = Buffer.from(data, "base64url").toString("utf-8");
          const parsed = JSON.parse(jsonStr);

          // بررسی تاریخ انقضای سشن توکن
          if (parsed && parsed.exp && Date.now() > parsed.exp) {
            return null;
          }

          return parsed;
        }
      }
    }

    // ۲. بررسی توکن‌های فال‌بک
    if (token.startsWith("AUTH-")) {
      const base64Data = token.replace("AUTH-", "");
      const jsonStr = Buffer.from(base64Data, "base64").toString("utf-8");
      return JSON.parse(jsonStr);
    }

    return null;
  } catch {
    return null;
  }
}