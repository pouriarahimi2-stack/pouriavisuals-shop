import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session_token")?.value;

    if (token) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: "admin_master",
          username: "admin",
          full_name: "مدیر ارشد سیستم",
          role: "superadmin",
        },
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}