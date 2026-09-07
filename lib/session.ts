// File Path: lib/session.ts

export interface SessionPayload {
  id?: string;
  username: string;
  role: string;
  full_name?: string;
  exp: number;
  iat: number;
  jti: string;
}

const DEFAULT_SECRET = "axon_core_enterprise_secure_vault_token_secret_key_2026_x";

function getSessionSecret(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || DEFAULT_SECRET;
  }
  return DEFAULT_SECRET;
}

function sha256(ascii: string): number[] {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i = 0, j = 0;
  let words: number[] = [];
  let asciiBitLength = ascii[lengthProperty as any] * 8;
  
  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while (ascii[lengthProperty as any] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty as any]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty as any]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty as any]] = (asciiBitLength | 0);

  for (j = 0; j < words[lengthProperty as any];) {
    let w = words.slice(j, j += 16);
    let oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      let w15 = w[i - 15], w2 = w[i - 2];
      let s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      let s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      let temp1 = (hash[7] + (((hash[4] >>> 6) | (hash[4] << 26)) ^ ((hash[4] >>> 11) | (hash[4] << 21)) ^ ((hash[4] >>> 25) | (hash[4] << 7))) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0)) | 0;
      let temp2 = ((((hash[0] >>> 2) | (hash[0] << 30)) ^ ((hash[0] >>> 13) | (hash[0] << 19)) ^ ((hash[0] >>> 22) | (hash[0] << 10))) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let bytes: number[] = [];
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      bytes.push((hash[i] >> (b * 8)) & 255);
    }
  }
  return bytes;
}

function hmacSha256(keyStr: string, message: string): string {
  let key: number[] = [];
  for (let i = 0; i < keyStr.length; i++) {
    key.push(keyStr.charCodeAt(i) & 255);
  }
  if (key.length > 64) {
    key = sha256(keyStr);
  }
  while (key.length < 64) {
    key.push(0);
  }

  let oKeyPad = "";
  let iKeyPad = "";
  for (let i = 0; i < 64; i++) {
    oKeyPad += String.fromCharCode(key[i] ^ 0x5c);
    iKeyPad += String.fromCharCode(key[i] ^ 0x36);
  }

  const innerHashBytes = sha256(iKeyPad + message);
  let innerHashStr = "";
  for (let i = 0; i < innerHashBytes.length; i++) {
    innerHashStr += String.fromCharCode(innerHashBytes[i]);
  }

  const outerHashBytes = sha256(oKeyPad + innerHashStr);
  let binary = "";
  for (let i = 0; i < outerHashBytes.length; i++) {
    binary += String.fromCharCode(outerHashBytes[i]);
  }
  
  const b64 = typeof btoa === "function" 
    ? btoa(binary) 
    : Buffer.from(binary, "binary").toString("base64");
    
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toBase64Url(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  );
  const b64 = typeof btoa === "function" ? btoa(utf8Bytes) : Buffer.from(str, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  return decodeURIComponent(
    binary.split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function generateSimpleUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    jti: generateSimpleUUID(),
  };

  const data = toBase64Url(JSON.stringify(session));
  const signature = hmacSha256(getSessionSecret(), data);
  return `${data}.${signature}`;
}

export function verifyPayload(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, providedSignature] = parts;
    const expectedSignature = hmacSha256(getSessionSecret(), data);

    if (!constantTimeCompare(providedSignature, expectedSignature)) {
      return null;
    }

    const jsonStr = fromBase64Url(data);
    const parsed: SessionPayload = JSON.parse(jsonStr);

    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.username !== "string" || !parsed.username.trim()) return null;
    if (typeof parsed.role !== "string" || !parsed.role.trim()) return null;
    if (typeof parsed.exp !== "number" || Date.now() >= parsed.exp) return null;

    return parsed;
  } catch {
    return null;
  }
}
