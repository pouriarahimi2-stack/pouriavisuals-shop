// File Path: app/api/security/vpn-check/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_BOTS_REGEX =
  /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|torob|emalls|basalam|telegrambot|whatsapp|twitterbot|facebookexternalhit|linkedinbot/i;

export async function GET(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (ALLOWED_BOTS_REGEX.test(ua)) {
      return NextResponse.json(
        { isVpn: false, country: "IR", isBot: true },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const country = (
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      ""
    )
      .trim()
      .toUpperCase();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // در محیط لوکال (localhost) یا در صورتی که هدر کشور وجود نداشته باشد، مسدود نشود
    if (!country || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) {
      return NextResponse.json(
        { isVpn: false, country: "IR", ip },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const isVpnActive = country !== "IR";

    return NextResponse.json(
      {
        isVpn: isVpnActive,
        country,
        ip,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({ isVpn: false, country: "IR" });
  }
}
