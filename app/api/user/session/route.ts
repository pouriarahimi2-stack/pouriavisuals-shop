import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const payload = await verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.id,
        phone: payload.phone,
        username: payload.username || payload.phone,
        email: (payload as any).email || null,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
