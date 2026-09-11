import crypto from "crypto";

const SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "axon_customer_fallback_secret_key_2026";

export interface CustomerSessionPayload {
  id: string;
  phone: string;
  username?: string;
  email?: string;
  name?: string;
  exp: number;
}

export function signCustomerPayload(user: { id: string; phone: string; username?: string; email?: string; name?: string }): string {
  const payload: CustomerSessionPayload = {
    ...user,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // ۳۰ روز اعتبار
  };

  const str = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(str).digest("base64url");
  return `${str}.${signature}`;
}

export function verifyCustomerToken(token: string): CustomerSessionPayload | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [payloadStr, signature] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadStr).digest("base64url");

    if (signature !== expectedSig) return null;

    const payload: CustomerSessionPayload = JSON.parse(Buffer.from(payloadStr, "base64url").toString());
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
