// File Path: lib/authSecurity.ts
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// سیستم ضد بروت‌فورس (Rate Limiter) در حافظه امن
interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // ۱۵ دقیقه مسدودسازی پس از ۵ تلاش اشتباه

export const authSecurity = {
  // بررسی و مهار حملات بروت‌فورس
  checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (!entry) return { allowed: true };

    if (entry.blockedUntil > now) {
      const waitMinutes = Math.ceil((entry.blockedUntil - now) / (60 * 1000));
      return { allowed: false, waitMinutes };
    }

    if (entry.blockedUntil <= now && entry.attempts >= MAX_ATTEMPTS) {
      loginAttempts.delete(ip);
    }

    return { allowed: true };
  },

  recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const entry = loginAttempts.get(ip) || { attempts: 0, blockedUntil: 0 };
    entry.attempts += 1;

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.blockedUntil = now + BLOCK_DURATION_MS;
    }

    loginAttempts.set(ip, entry);
  },

  resetAttempts(ip: string): void {
    loginAttempts.delete(ip);
  },

  // هش کردن رمز عبور با تولید Salt اختصاصی و الگوریتم Scrypt
  hashPassword(password: string): string {
    const clean = String(password).trim();
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(clean, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  },

  // اعتبارسنجی امن کلمه عبور با مقایسه تساوی زمانی (Timing-Safe)
  verifyPassword(password: string, storedHashOrPlain: string): boolean {
    try {
      const clean = String(password).trim();
      const stored = String(storedHashOrPlain).trim();

      // اگر رمز هش شده باشد (قالب salt:hash)
      if (stored.includes(":")) {
        const [salt, key] = stored.split(":");
        if (!salt || !key) return false;

        const keyBuffer = Buffer.from(key, "hex");
        const derivedKeyBuffer = scryptSync(clean, salt, 64);

        if (keyBuffer.length !== derivedKeyBuffer.length) return false;
        return timingSafeEqual(keyBuffer, derivedKeyBuffer);
      }

      // پشتیبانی موقت برای رمزهای پیش‌فرض با مقایسه تساوی زمانی
      const inputBuffer = Buffer.from(clean);
      const storedBuffer = Buffer.from(stored);

      if (inputBuffer.length !== storedBuffer.length) return false;
      return timingSafeEqual(inputBuffer, storedBuffer);
    } catch {
      return false;
    }
  },
};

export default authSecurity;