import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'pv_admin_super_secret_session_key_2026_apple_store_secure';

/**
 * تولید توکن امن با امضای دیجیتال HMAC-SHA256
 */
export function signPayload(payload: any): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hmac = createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  const signature = hmac.digest('base64url');
  return `${data}.${signature}`;
}

/**
 * تأیید امضای توکن و بازگرداندن داده‌های اصلی در صورت صحت امضا
 */
export function verifyPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;

    const hmac = createHmac('sha256', SESSION_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
      return null;
    }

    const jsonStr = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
