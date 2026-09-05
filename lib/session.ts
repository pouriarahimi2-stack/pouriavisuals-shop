import crypto from "crypto";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_core_super_secure_vault_2026_key";

export interface SessionPayload {
  id?: string;
  username: string;
  role: string;
  full_name?: string;
  exp: number;
}

export function signPayload(payload: Omit<SessionPayload, "exp">, expiresInDays = 7): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const data: SessionPayload = { ...payload, exp };
  const jsonStr = JSON.stringify(data);
  const base64Data = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${signature}`;
}

export function verifyPayload(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string" || !token.includes(".")) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Data)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const jsonStr = Buffer.from(base64Data, "base64url").toString("utf8");
    const data: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
