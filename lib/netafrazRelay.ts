// File Path: lib/netafrazRelay.ts
import https from "https";
import crypto from "crypto";

const DEFAULT_MASTER_SECRET = "AXON_AES256_HMAC_MASTER_KEY_2026_9F8E7D6C5B4A3F2E1D0C";
export const NETAFRAZ_WEB_IP = "185.106.201.79";
export const NETAFRAZ_BANK_OUTBOUND_IP = "185.106.201.76";

function getBinaryKey(): Buffer {
  const secret = (process.env.AXON_RELAY_SECRET || DEFAULT_MASTER_SECRET).trim();
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptRelayEnvelope(plainObj: Record<string, any>): string {
  const key = getBinaryKey();
  const iv = crypto.randomBytes(16);
  const plaintext = JSON.stringify(plainObj);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const ts = Math.floor(Date.now() / 1000).toString();
  const ivB64 = iv.toString("base64");
  const ctB64 = encrypted.toString("base64");

  const sig = crypto
    .createHmac("sha256", key)
    .update(ts + "." + ivB64 + "." + ctB64)
    .digest("hex");

  return JSON.stringify({
    ts,
    iv: ivB64,
    ct: ctB64,
    sig,
  });
}

function httpsEncryptedRelayRequest(
  connectHostOrIp: string,
  hostHeader: string,
  pathStr: string,
  encryptedEnvelopeStr: string,
  strictTls: boolean,
  timeoutMs = 6500
): Promise<{ status: number; bodyText: string }> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: connectHostOrIp,
      port: 443,
      path: pathStr,
      method: "POST",
      servername: hostHeader,
      rejectUnauthorized: strictTls,
      headers: {
        Host: hostHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(encryptedEnvelopeStr).toString(),
        "User-Agent": "AxonCore-EncryptedBridge/2.0",
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 500,
          bodyText: raw,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Encrypted Relay Timeout"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(encryptedEnvelopeStr);
    req.end();
  });
}

export async function postViaNetafrazRelay(
  targetUrl: string,
  headers: Record<string, string>,
  payload: Record<string, any>,
  timeoutMs = 6500
): Promise<{ usedRelay: boolean; relayUrl?: string; status: number; data: any } | null> {
  // بسته ارسالی با AES-256-CBC رمزنگاری و با HMAC-SHA256 امضا می‌شود
  const encryptedEnvelope = encryptRelayEnvelope({
    targetUrl,
    headers,
    payload,
  });

  // ارتباط صرفاً روی پورت 443 (HTTPS) انجام می‌شود (پورت 80 ناامن به طور کامل حذف شد)
  const candidates = [
    {
      label: "HTTPS-Subdomain (https://gate.axoncore.ir:443)",
      connectHost: "gate.axoncore.ir",
      hostHeader: "gate.axoncore.ir",
      strictTls: true,
    },
    {
      label: "HTTPS-Direct-IP (https://185.106.201.79:443 + AES-256)",
      connectHost: NETAFRAZ_WEB_IP,
      hostHeader: "gate.axoncore.ir",
      strictTls: false,
    },
  ];

  for (const c of candidates) {
    try {
      const res = await httpsEncryptedRelayRequest(
        c.connectHost,
        c.hostHeader,
        "/axon-relay.php",
        encryptedEnvelope,
        c.strictTls,
        timeoutMs
      );

      if (res.status === 404 || res.status === 405 || res.status === 301 || res.status === 302) {
        continue;
      }

      const parsed = JSON.parse(res.bodyText);
      return {
        usedRelay: true,
        relayUrl: c.label,
        status: res.status,
        data: parsed,
      };
    } catch {
      // ادامه به کاندید بعدی
    }
  }

  return null;
}
