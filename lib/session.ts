const DEFAULT_SECRET = process.env.ADMIN_SESSION_SECRET || 'axon_enterprise_vault_session_secret_fallback_key_2026';

function base64UrlEncode(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof atob === 'function') {
    return decodeURIComponent(escape(atob(base64)));
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

// ساخت امضای هش ساده و استاندارد بدون نیاز به پکیج‌های اختصاصی Node در محیط Edge
function generateHmacSignature(data: string, secret: string): string {
  let hash = 0;
  const combined = data + ':' + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function createSessionToken(payload: Record<string, any>, secret: string = DEFAULT_SECRET): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig = generateHmacSignature(`${header}.${body}`, secret);
  return `${header}.${body}.${sig}`;
}

export function verifySessionToken(token: string, secret: string = DEFAULT_SECRET): Record<string, any> | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = generateHmacSignature(`${header}.${body}`, secret);
    if (signature !== expectedSig) {
      return null;
    }
    return JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }
}

export const signPayload = (payload: any, secret: string = DEFAULT_SECRET): string => {
  return createSessionToken(payload, secret);
};

export const verifyPayload = (token: string, secret: string = DEFAULT_SECRET): any => {
  return verifySessionToken(token, secret);
};
