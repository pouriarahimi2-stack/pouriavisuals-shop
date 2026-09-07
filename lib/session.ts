// File Path: lib/session.ts
import { createHmac, timingSafeEqual, randomUUID } from "crypto";

export interface SessionPayload {
  id?: string;
  username: string;
  role: string;
  full_name?: string;
  exp: number;
  iat: number;
  jti: string;
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "axon_core_enterprise_secure_vault_token_secret_key_2026_x";
  return secret;
}

function encode(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

export function signPayload(
  payload: Omit<SessionPayload, "exp" | "iat" | "jti">,
  expiresInDays = 7
): string {
  const now = Date.now();
  const session: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInDays * 24 * 60 * 60 * 1000,
    jti: randomUUID(),
  };

  const data = encode(session);
  return `${data}.${sign(data)}`;
}

export function verifyPayload(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, providedSignature] = parts;
    const expectedSignature = sign(data);

    const a = Buffer.from(providedSignature, "utf8");
    const b = Buffer.from(expectedSignature, "utf8");

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    const parsed: SessionPayload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    );

    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.username !== "string" || !parsed.username.trim()) return null;
    if (typeof parsed.role !== "string" || !parsed.role.trim()) return null;
    if (typeof parsed.exp !== "number" || Date.now() >= parsed.exp) return null;

    return parsed;
  } catch {
    return null;
  }
}
