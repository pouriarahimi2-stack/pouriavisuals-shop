import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerToken } from "@/lib/customerSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("customer_session_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        phone: payload.phone,
        username: payload.username,
        email: payload.email,
        name: payload.name,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "با موفقیت خارج شدید." });
  response.cookies.delete("customer_session_token");
  return response;
}
