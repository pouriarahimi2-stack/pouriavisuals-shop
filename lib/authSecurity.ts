import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

interface RateLimitRecord {
  attempts: number;
  blockedUntil: number | null;
  lastAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export const authSecurity = {
  checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) return { allowed: true };

    if (record.blockedUntil && record.blockedUntil > now) {
      const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      return { allowed: false, waitMinutes };
    }

    if (now - record.lastAttempt > 15 * 60 * 1000) {
      rateLimitMap.delete(ip);
      return { allowed: true };
    }

    return { allowed: true };
  },

  recordFailedAttempt(ip: string) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { attempts: 0, blockedUntil: null, lastAttempt: now };

    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= 5) {
      record.blockedUntil = now + 15 * 60 * 1000;
    }

    rateLimitMap.set(ip, record);
  },

  resetAttempts(ip: string) {
    rateLimitMap.delete(ip);
  },

  hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  },

  verifyPassword(supplied: string, stored: string): boolean {
    if (!stored || !stored.includes(":")) {
      // رد قطعی پسوردهای بدون فرمت سالت و هش (رد هرگونه متن ساده)
      return false;
    }

    try {
      const [salt, key] = stored.split(":");
      const keyBuffer = Buffer.from(key, "hex");
      const derivedBuffer = scryptSync(supplied, salt, 64);
      return timingSafeEqual(keyBuffer, derivedBuffer);
    } catch {
      return false;
    }
  },
};
