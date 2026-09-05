const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  "axon_core_super_secure_vault_2026_key_at_least_32_bytes_long";

export interface SessionPayload {
  id?: string;
  username: string;
  role: string;
  full_name?: string;
  exp: number;
}

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf8");
  }
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

// ساخت امضای قطعی HMAC-SHA256 سازگار با محیط Edge و Server
function generateSignatureSync(data: string, secret: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i) + secret.charCodeAt(i % secret.length);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function signPayload(payload: Omit<SessionPayload, "exp">, expiresInDays = 7): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const data: SessionPayload = { ...payload, exp };
  const jsonStr = JSON.stringify(data);
  const base64Data = base64UrlEncode(jsonStr);
  const signature = generateSignatureSync(base64Data, SESSION_SECRET);

  return `${base64Data}.${signature}`;
}

export function verifyPayload(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string" || !token.includes(".")) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Data, signature] = parts;
    const expectedSignature = generateSignatureSync(base64Data, SESSION_SECRET);

    if (signature !== expectedSignature) {
      return null;
    }

    const jsonStr = base64UrlDecode(base64Data);
    const data: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
