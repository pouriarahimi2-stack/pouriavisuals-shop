import { NextRequest, NextResponse } from "next/server";
import { verifyPayload, COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = await verifyPayload(token);
    if (payload && payload.username && payload.role) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: payload.id,
          username: payload.username,
          full_name: payload.full_name || payload.username,
          role: payload.role,
        },
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
