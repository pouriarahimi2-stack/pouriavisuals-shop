// File Path: app/api/admin/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPayload } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("admin_session_token")?.value ||
      req.cookies.get("pv_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = verifyPayload(token);

    if (payload && (payload.username || payload.role)) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: payload.id || "admin_master",
          username: payload.username || "admin",
          full_name: payload.full_name || payload.username || "مدیر سیستم",
          role: payload.role || "superadmin",
        },
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}