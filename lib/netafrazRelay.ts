// File Path: lib/netafrazRelay.ts
export const NETAFRAZ_RELAY_SECRET = "AXON_NETAFRAZ_BRIDGE_SECRET_2026_9F8E7D6C5B4A";

export function getCandidateRelayUrls(): string[] {
  const customEnv = (process.env.IRAN_STATIC_RELAY_URL || "").trim();
  const urls = [
    customEnv,
    "https://gate.axoncore.ir/axon-relay.php",
    "http://gate.axoncore.ir/axon-relay.php",
    "https://gate.axoncore.ir/index.php",
  ].filter(Boolean);
  return Array.from(new Set(urls));
}

export async function postViaNetafrazRelay(
  targetUrl: string,
  headers: Record<string, string>,
  payload: Record<string, any>,
  timeoutMs = 5000
): Promise<{ usedRelay: boolean; relayUrl?: string; status: number; data: any } | null> {
  const relayUrls = getCandidateRelayUrls();

  for (const relayUrl of relayUrls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Axon-Relay-Key": NETAFRAZ_RELAY_SECRET,
        },
        body: JSON.stringify({
          targetUrl,
          headers,
          payload,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      // اگر هنوز فایل روی ساب‌دامنه آپلود نشده (404) یا به Vercel اشاره می‌کند، برو سراغ بعدی
      if (res.status === 404 || res.status === 405) {
        continue;
      }

      const text = await res.text().catch(() => "");
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }

      return {
        usedRelay: true,
        relayUrl,
        status: res.status,
        data: parsed,
      };
    } catch {
      clearTimeout(timer);
    }
  }

  return null;
}
