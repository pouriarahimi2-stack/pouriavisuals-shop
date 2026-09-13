import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: "اتصال به سوییچ پرداخت در انتظار پیکربندی مرچنت بانکی است.",
    },
    { status: 503 }
  );
}
