// File Path: app/api/media-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url") || "";
    if (!rawUrl || (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://"))) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const upstream = await fetch(rawUrl, {
      headers: { "User-Agent": "AxonCore-MediaProxy/2.0" },
    });

    if (!upstream.ok) {
      return new NextResponse("Media not found", { status: 404 });
    }

    const contentType =
      upstream.headers.get("content-type") ||
      (rawUrl.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "image/png");
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}
