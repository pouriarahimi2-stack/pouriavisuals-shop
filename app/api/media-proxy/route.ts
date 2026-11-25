// File Path: app/api/media-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_MEDIA_PREFIXES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "video/mp4",
  "video/webm",
];

function isBlockedInternalHost(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (!h) return true;
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }

  // بررسی آدرس‌های IPv4 خصوصی و رزروشده
  const ipv4Match = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    ) {
      return true;
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url") || "";
    if (!rawUrl) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return new NextResponse("Unsupported protocol", { status: 400 });
    }

    if (isBlockedInternalHost(parsedUrl.hostname)) {
      return new NextResponse("Forbidden host", { status: 403 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const upstream = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "AxonCore-MediaProxy/2.1" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!upstream.ok) {
      return new NextResponse("Media not found", { status: 404 });
    }

    const rawContentType = String(
      upstream.headers.get("content-type") || ""
    )
      .split(";")[0]
      .trim()
      .toLowerCase();

    const inferredType =
      rawContentType ||
      (parsedUrl.pathname.toLowerCase().endsWith(".svg")
        ? "image/svg+xml"
        : "image/png");

    if (!ALLOWED_MEDIA_PREFIXES.includes(inferredType)) {
      return new NextResponse("Unsupported media type", { status: 415 });
    }

    const contentLength = Number(upstream.headers.get("content-length") || 0);
    if (contentLength > 15 * 1024 * 1024) {
      return new NextResponse("Media too large", { status: 413 });
    }

    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > 15 * 1024 * 1024) {
      return new NextResponse("Media too large", { status: 413 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": inferredType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}