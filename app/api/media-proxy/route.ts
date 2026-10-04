// File Path: app/api/media-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url") || "";
    if (!rawUrl) return new NextResponse("Missing URL", { status: 400 });

    const parsed = new URL(rawUrl);
    const allowedSupabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "supabase.co";

    // امنیت کامل: فقط مجاز به خواندن از باکت Supabase خود پروژه
    if (
      !parsed.hostname.endsWith("supabase.co") &&
      parsed.hostname !== allowedSupabaseHost
    ) {
      return new NextResponse("Forbidden Host", { status: 403 });
    }

    const upstream = await fetch(parsed.toString(), { cache: "no-store" });
    if (!upstream.ok) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    const arrayBuf = await upstream.arrayBuffer();

    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
